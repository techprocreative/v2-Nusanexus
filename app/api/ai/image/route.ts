import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAIClient } from '@/lib/ai/provider-client';
import { z } from 'zod';

const ImageSchema = z.object({
    prompt: z.string().min(1).max(2000),
    model: z.string().optional(),
    size: z.enum(['1024x1024', '1024x1792', '1792x1024']).optional(),
    quality: z.enum(['standard', 'hd']).optional(),
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
        const parsed = ImageSchema.safeParse(json);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request payload', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const {
            prompt,
            model = 'dall-e-3',
            size = '1024x1024',
            quality = 'standard',
            presetId,
        } = parsed.data;

        // Check workspace credits
        const { data: workspace } = await supabase
            .from('workspaces')
            .select('credit_count')
            .eq('id', profile.current_workspace_id)
            .single();

        if (!workspace || (workspace.credit_count ?? 0) < 10) {
            return NextResponse.json({ error: 'Insufficient credits (minimum 10 required)' }, { status: 402 });
        }

        // Get AI client for image generation
        const openai = await getAIClient('image');

        // Generate image
        const response = await openai.images.generate({
            model,
            prompt,
            size: size as any,
            quality: quality as any,
            n: 1,
        });

        const imageUrl = response.data[0]?.url;
        if (!imageUrl) {
            throw new Error('No image URL returned');
        }

        // Download image and upload to Supabase Storage
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('images')
            .upload(`${profile.current_workspace_id}/${fileName}`, imageBuffer, {
                contentType: 'image/png',
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json({ error: 'Failed to save image' }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(uploadData.path);

        // Calculate credits (based on size and quality)
        let creditsUsed = 10; // base cost
        if (size === '1024x1792' || size === '1792x1024') creditsUsed = 15;
        if (quality === 'hd') creditsUsed *= 2;

        // Save to library
        const { data: item, error: insertError } = await supabase
            .from('library_items')
            .insert({
                workspace_id: profile.current_workspace_id,
                user_id: user.id,
                preset_id: presetId || null,
                type: 'image',
                title: prompt.slice(0, 100),
                content: publicUrl,
                request_params: { prompt, model, size, quality },
                model,
                used_credit_count: creditsUsed,
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
                credit_count: (workspace.credit_count ?? 0) - creditsUsed,
            })
            .eq('id', profile.current_workspace_id);

        // Track usage stats (image)
        try {
            await serviceClient.from('stats').insert({
                workspace_id: profile.current_workspace_id,
                type: 'usage',
                date: new Date().toISOString().slice(0, 10),
                metric: creditsUsed,
                metadata: {
                    feature: 'image',
                    model,
                    size,
                    quality,
                    user_id: user.id,
                },
            });
        } catch (statsError) {
            console.error('Failed to record usage stats (image):', statsError);
        }

        return NextResponse.json({
            success: true,
            item,
            imageUrl: publicUrl,
            usage: {
                credits: creditsUsed,
            },
        });
    } catch (error: any) {
        console.error('Image generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate image' },
            { status: 500 }
        );
    }
}
