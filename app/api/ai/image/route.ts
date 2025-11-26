import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAIClient } from '@/lib/ai/provider-client';
import {
    loadCreditsPerUsd,
    loadModelPricing,
    calculateSimpleCredits,
} from '@/lib/ai/pricing';
import { checkRateLimit } from '@/lib/rate-limit';

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
            model = 'dall-e-3',
            size = '1024x1024',
            quality = 'standard',
            presetId,
        } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Simple per-user rate limiting for image generation
        const rate = await checkRateLimit(supabase, user.id, 'ai:image', 30, 60_000);
        if (!rate.ok) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please try again later.' },
                { status: 429 }
            );
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

        const creditsPerUsd = await loadCreditsPerUsd(supabase);
        const { providerInputCost, markupMultiplier } = await loadModelPricing(
            supabase,
            model,
            'image'
        );

        // Fallback manual credits based on size and quality (previous behavior)
        let baseCreditsFallback = 10;
        if (size === '1024x1792' || size === '1792x1024') baseCreditsFallback = 15;
        if (quality === 'hd') baseCreditsFallback *= 2;

        const {
            creditsUsed: creditsNeeded,
            providerCostUsd,
            platformCostUsd,
        } = calculateSimpleCredits({
            baseCostUnit: providerInputCost,
            usageUnit: 1,
            creditsPerUsd,
            markupMultiplier,
            fallbackCredits: baseCreditsFallback,
        });

        if ((workspace.credit_count ?? 0) < creditsNeeded) {
            return NextResponse.json(
                { error: 'Insufficient credits' },
                { status: 402 }
            );
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
        const {
            data: { publicUrl },
        } = supabase.storage
            .from('images')
            .getPublicUrl(uploadData.path);

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
            imageUrl: publicUrl,
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
        console.error('Image generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate image' },
            { status: 500 }
        );
    }
}
