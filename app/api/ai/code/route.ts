import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAIClient } from '@/lib/ai/provider-client';
import {
    loadCreditsPerUsd,
    loadModelPricing,
    calculateLlmCredits,
} from '@/lib/ai/pricing';

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
        const {
            prompt,
            language = 'javascript',
            model = 'gpt-4',
            presetId,
        } = body;

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

        const creditsPerUsd = await loadCreditsPerUsd(supabase);
        const { providerInputCost, providerOutputCost, markupMultiplier } =
            await loadModelPricing(supabase, model, 'llm');

        // Get AI client
        const openai = await getAIClient('llm');

        // System prompt optimized for code generation
        const systemPrompt = `You are an expert programmer. Generate clean, well-documented ${language} code based on the user's request. Include comments explaining key parts of the code. Format the code properly with correct indentation.`;

        // Generate code
        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ],
            max_tokens: 2000,
            temperature: 0.3, // Lower temperature for more deterministic code
        });

        const content = completion.choices[0]?.message?.content ?? '';
        const usage = completion.usage;
        const promptTokens = usage?.prompt_tokens ?? usage?.total_tokens ?? 0;
        const completionTokens = usage?.completion_tokens ?? 0;

        const {
            creditsUsed,
            tokensUsed,
            providerCostUsd,
            platformCostUsd,
        } = calculateLlmCredits({
            promptTokens,
            completionTokens,
            creditsPerUsd,
            providerInputCost,
            providerOutputCost,
            markupMultiplier,
            fallbackCostPerThousandTokensUsd: 0.002,
        });

        // Extract code from markdown code blocks if present
        let code = content;
        const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/;
        const match = content.match(codeBlockRegex);
        if (match) {
            code = match[1];
        }

        // Save to library
        const { data: item, error: insertError } = await supabase
            .from('library_items')
            .insert({
                workspace_id: profile.current_workspace_id,
                user_id: user.id,
                preset_id: presetId || null,
                type: 'code',
                title: prompt.slice(0, 100),
                content: code,
                request_params: { prompt, model, language },
                model,
                used_credit_count: creditsUsed,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json({ error: 'Failed to save code' }, { status: 500 });
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
            code,
            explanation: content.includes('```') ? content.split('```')[0].trim() : '',
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
        console.error('Code generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate code' },
            { status: 500 }
        );
    }
}
