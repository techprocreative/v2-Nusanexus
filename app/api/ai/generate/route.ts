import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAIClient } from '@/lib/ai/provider-client';
import { z } from 'zod';

const GenerateSchema = z.object({
  prompt: z.string().min(1).max(8000),
  model: z.string().optional(),
  type: z.string().optional(),
  presetId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const serviceClient = createServiceClient();
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

    const json = await request.json().catch(() => null);
    const parsed = GenerateSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { prompt, model = 'gpt-4', type = 'document', presetId } = parsed.data;

    // Check workspace credits
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('credit_count')
      .eq('id', profile.current_workspace_id)
      .single();

    if (!workspace || (workspace.credit_count ?? 0) <= 0) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Get AI client from database configuration
    const openai = await getAIClient('llm');

    // Generate content
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    });

    const content = completion.choices[0]?.message?.content ?? '';
    const tokensUsed = completion.usage?.total_tokens ?? 0;
    const creditsUsed = tokensUsed / 1000; // 1 credit per 1000 tokens

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

    // Track usage stats (credits)
    try {
      await serviceClient.from('stats').insert({
        workspace_id: profile.current_workspace_id,
        type: 'usage',
        date: new Date().toISOString().slice(0, 10),
        metric: creditsUsed,
        metadata: {
          feature: type,
          model,
          user_id: user.id,
        },
      });
    } catch (statsError) {
      console.error('Failed to record usage stats (generate):', statsError);
    }

    return NextResponse.json({
      success: true,
      item,
      usage: {
        tokens: tokensUsed,
        credits: creditsUsed,
      },
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
