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

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const language = formData.get('language') as string;

        if (!file) {
            return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
        }

        // Load workspace credits
        const { data: workspace } = await supabase
            .from('workspaces')
            .select('credit_count')
            .eq('id', profile.current_workspace_id)
            .single();

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 400 });
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

        // Look up model pricing (provider cost) from ai_models
        const modelId = 'whisper-1';

        const { data: modelRow } = await supabase
            .from('ai_models')
            .select(
                `
                input_cost,
                provider:ai_providers(config)
            `
            )
            .eq('model_id', modelId)
            .eq('type', 'transcription')
            .eq('status', 1)
            .limit(1)
            .single();

        const providerInputCost =
            typeof modelRow?.input_cost === 'number'
                ? modelRow.input_cost
                : Number(modelRow?.input_cost) || 0;

        const markupMultiplier =
            (modelRow as any)?.provider?.config?.markup_multiplier ?? 1.5;

        const fileSizeMb = file.size / (1024 * 1024);
        let providerCostUsd = 0;
        let platformCostUsd = 0;
        let creditsNeeded: number;

        if (providerInputCost > 0) {
            // Treat input_cost as provider cost per MB of audio
            providerCostUsd = providerInputCost * fileSizeMb;
            platformCostUsd = providerCostUsd * markupMultiplier;
            creditsNeeded = Math.max(
                1,
                Math.ceil(platformCostUsd * creditsPerUsd)
            );
        } else {
            // Fallback fixed cost
            creditsNeeded = 5;
        }

        if ((workspace.credit_count ?? 0) < creditsNeeded) {
            return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
        }

        // Get AI client
        const openai = await getAIClient('transcription');

        // Transcribe audio
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: modelId,
            language: language || undefined,
        });

        const transcriptText = transcription.text;

        // Save to library
        const { data: item, error: insertError } = await supabase
            .from('library_items')
            .insert({
                workspace_id: profile.current_workspace_id,
                user_id: user.id,
                type: 'transcription',
                title: `Transcription - ${file.name}`,
                content: transcriptText,
                request_params: { fileName: file.name, language },
                model: modelId,
                used_credit_count: creditsNeeded,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json({ error: 'Failed to save transcription' }, { status: 500 });
        }

        // Deduct credits
        await supabase
            .from('workspaces')
            .update({
                credit_count: (workspace.credit_count ?? 0) - creditsNeeded,
            })
            .eq('id', profile.current_workspace_id);

        return NextResponse.json({
            success: true,
            item,
            transcription: transcriptText,
            usage: {
                credits: creditsNeeded,
                pricing: {
                    provider_input_cost: providerInputCost,
                    provider_cost_usd: providerCostUsd,
                    platform_cost_usd: platformCostUsd,
                    markup_multiplier: markupMultiplier,
                    credits_per_usd: creditsPerUsd,
                    file_size_mb: fileSizeMb,
                },
            },
        });
    } catch (error: any) {
        console.error('Transcription error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to transcribe audio' },
            { status: 500 }
        );
    }
}
