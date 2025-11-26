import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAIClient } from '@/lib/ai/provider-client';
import { z } from 'zod';

const TtsSchema = z.object({
    text: z.string().min(1).max(10000),
    voice: z.string().optional(),
    model: z.string().optional(),
    speed: z.number().min(0.5).max(2).optional(),
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
        const parsed = TtsSchema.safeParse(json);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request payload', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const {
            text,
            voice = 'alloy',
            model = 'tts-1',
            speed = 1.0,
            presetId,
        } = parsed.data;

        // Check workspace credits
        const { data: workspace } = await supabase
            .from('workspaces')
            .select('credit_count')
            .eq('id', profile.current_workspace_id)
            .single();

        const creditsNeeded = Math.ceil(text.length / 1000); // 1 credit per 1000 chars
        if (!workspace || (workspace.credit_count ?? 0) < creditsNeeded) {
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
        const { data: { publicUrl } } = supabase.storage
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

        // Track usage stats (tts)
        try {
            await serviceClient.from('stats').insert({
                workspace_id: profile.current_workspace_id,
                type: 'usage',
                date: new Date().toISOString().slice(0, 10),
                metric: creditsNeeded,
                metadata: {
                    feature: 'tts',
                    model,
                    voice,
                    user_id: user.id,
                },
            });
        } catch (statsError) {
            console.error('Failed to record usage stats (tts):', statsError);
        }

        return NextResponse.json({
            success: true,
            item,
            audioUrl: publicUrl,
            usage: {
                credits: creditsNeeded,
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
