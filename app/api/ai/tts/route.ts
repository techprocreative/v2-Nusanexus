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
        const {
            text,
            voice = 'alloy',
            model = 'tts-1',
            speed = 1.0,
            presetId,
        } = body;

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
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
        const { data: modelRow } = await supabase
            .from('ai_models')
            .select(
                `
                input_cost,
                provider:ai_providers(config)
            `
            )
            .eq('model_id', model)
            .eq('type', 'tts')
            .eq('status', 1)
            .limit(1)
            .single();

        const providerInputCost =
            typeof modelRow?.input_cost === 'number'
                ? modelRow.input_cost
                : Number(modelRow?.input_cost) || 0;

        const markupMultiplier =
            (modelRow as any)?.provider?.config?.markup_multiplier ?? 1.5;

        let providerCostUsd = 0;
        let platformCostUsd = 0;
        let creditsNeeded: number;

        if (providerInputCost > 0) {
            // Treat input_cost as provider cost per 1000 characters
            providerCostUsd = providerInputCost * (text.length / 1000);
            platformCostUsd = providerCostUsd * markupMultiplier;
            creditsNeeded = Math.max(
                1,
                Math.ceil(platformCostUsd * creditsPerUsd)
            );
        } else {
            // Fallback: 1 credit per 1000 characters
            creditsNeeded = Math.ceil(text.length / 1000);
        }

        if ((workspace.credit_count ?? 0) < creditsNeeded) {
            return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
        }

        // Get AI client
        const openai = await getAIClient('tts');

        // Generate speech
        const mp3 = await openai.audio.speech.create({
            model,
            voice: voice as any,
            input: text,
            speed,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('audio')
            .upload(`${profile.current_workspace_id}/${fileName}`, buffer, {
                contentType: 'audio/mpeg',
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json({ error: 'Failed to save audio' }, { status: 500 });
        }

        // Get public URL
        const {
            data: { publicUrl },
        } = supabase.storage
            .from('audio')
            .getPublicUrl(uploadData.path);

        // Save to library
        const { data: item, error: insertError } = await supabase
            .from('library_items')
            .insert({
                workspace_id: profile.current_workspace_id,
                user_id: user.id,
                preset_id: presetId || null,
                type: 'speech',
                title: text.slice(0, 100),
                content: publicUrl,
                request_params: { text, voice, model, speed },
                model,
                used_credit_count: creditsNeeded,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert error:', insertError);
            return NextResponse.json({ error: 'Failed to save to library' }, { status: 500 });
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
            audioUrl: publicUrl,
            usage: {
                credits: creditsNeeded,
                pricing: {
                    provider_input_cost: providerInputCost,
                    provider_cost_usd: providerCostUsd,
                    platform_cost_usd: platformCostUsd,
                    markup_multiplier: markupMultiplier,
                    credits_per_usd: creditsPerUsd,
                },
            },
        });
    } catch (error: any) {
        console.error('TTS error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate speech' },
            { status: 500 }
        );
    }
}
