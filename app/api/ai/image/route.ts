import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAIClient } from '@/lib/ai/provider-client';

export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('users')
            .select('current_workspace_id')
            .eq('id', user.id)
            .single();

        if (!profile?.current_workspace_id) {
            return NextResponse.json({ error: 'No workspace selected' }, { status: 400 });
        }

        const body = await request.json();
        const {
            prompt,
            model = 'dall-e-3',
            size = '1024x1024',
            quality = 'standard',
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
