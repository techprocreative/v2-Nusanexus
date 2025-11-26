import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAIClient } from '@/lib/ai/provider-client';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('current_workspace_id')
      .eq('id', user.id)
      .single();

    if (!profile?.current_workspace_id) {
      return NextResponse.json({ error: 'No workspace selected' }, { status: 400 });
    }

    const body = await request.json();
    const { prompt, model = 'gpt-4', type = 'document', presetId } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Check workspace credits
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('credit_count')
      .eq('id', profile.current_workspace_id)
      .single();

    if (!workspace || (workspace.credit_count ?? 0) <= 0) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Load pricing settings from options table
    const { data: optionsRows } = await supabase
      .from('options')
      .select('key, value')
      .in('key', ['credits_per_usd']);

    const options =
      optionsRows?.reduce((acc: any, row: any) => {
        acc[row.key] = row.value;
        return acc;
      }, {}) || {};

    const creditsPerUsd =
      typeof options.credits_per_usd === 'number'
        ? options.credits_per_usd
        : Number(options.credits_per_usd) || 100;

    // Get AI client from database configuration
    const openai = await getAIClient('llm');

    // Generate content
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const usage = completion.usage;
    const promptTokens = usage?.prompt_tokens ?? usage?.total_tokens ?? 0;
    const completionTokens = usage?.completion_tokens ?? 0;
    const tokensUsed = usage?.total_tokens ?? promptTokens + completionTokens;

    // Look up model pricing (provider cost) from ai_models
    const { data: modelRow } = await supabase
      .from('ai_models')
      .select(
        `
        input_cost,
        output_cost,
        provider:ai_providers(config)
      `
      )
      .eq('model_id', model)
      .eq('type', 'llm')
      .eq('status', 1)
      .limit(1)
      .single();

    const providerInputCost =
      typeof modelRow?.input_cost === 'number'
        ? modelRow.input_cost
        : Number(modelRow?.input_cost) || 0;
    const providerOutputCost =
      typeof modelRow?.output_cost === 'number'
        ? modelRow.output_cost
        : Number(modelRow?.output_cost) || 0;

    const markupMultiplier =
      (modelRow as any)?.provider?.config?.markup_multiplier ?? 1.5;

    const providerCostUsd =
      (promptTokens / 1000) * providerInputCost +
      (completionTokens / 1000) * providerOutputCost;

    const platformCostUsd = providerCostUsd * markupMultiplier;

    let creditsUsed = Math.max(
      1,
      Math.ceil(
        (platformCostUsd || (tokensUsed / 1000) * 0.002) * creditsPerUsd
      )
    );

    // Save to library
    const { data: item, error: insertError } = await supabase
      .from('library_items')
      .insert({
        workspace_id: profile.current_workspace_id,
        user_id: user.id,
        preset_id: presetId || null,
        type,
        title: prompt.slice(0, 100),
        content,
        request_params: { prompt, model },
        model,
        used_credit_count: creditsUsed,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
    }

    // Deduct credits
    await supabase
      .from('workspaces')
      .update({
        credit_count: (workspace.credit_count ?? 0) - creditsUsed,
      })
      .eq('id', profile.current_workspace_id);

    return NextResponse.json({
      success: true,
      item,
      usage: {
        tokens: tokensUsed,
        credits: creditsUsed,
        pricing: {
          provider_input_cost: providerInputCost,
          provider_output_cost: providerOutputCost,
          provider_cost_usd: providerCostUsd,
          platform_cost_usd: platformCostUsd,
          markup_multiplier: markupMultiplier,
          credits_per_usd: creditsPerUsd,
        },
      },
    });
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
