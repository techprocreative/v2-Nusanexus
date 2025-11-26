import { createClient, createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getAIClient } from '@/lib/ai/provider-client';
import { z } from 'zod';

const CodeSchema = z.object({
    prompt: z.string().min(1).max(8000),
    language: z.string().min(1).max(50).optional(),
    model: z.string().optional(),
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
        const parsed = CodeSchema.safeParse(json);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request payload', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const {
            prompt,
            language = 'javascript',
            model = 'gpt-4',
            presetId,
        } = parsed.data;

        // Check workspace credits
        const { data: workspace } = await supabase
            .from('workspaces')
            .select('credit_count')
            .eq('id', profile.current_workspace_id)
            .single();

        if (!workspace || (workspace.credit_count ?? 0) <= 0) {
            return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
        }

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
        const tokensUsed = completion.usage?.total_tokens ?? 0;
        const creditsUsed = Math.ceil(tokensUsed / 1000);

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

        // Track usage stats (code)
        try {
            await serviceClient.from('stats').insert({
                workspace_id: profile.current_workspace_id,
                type: 'usage',
                date: new Date().toISOString().slice(0, 10),
                metric: creditsUsed,
                metadata: {
                    feature: 'code',
                    model,
                    user_id: user.id,
                    language,
                },
            });
        } catch (statsError) {
            console.error('Failed to record usage stats (code):', statsError);
        }

        return NextResponse.json({
            success: true,
            item,
            code,
            explanation: content.includes('```') ? content.split('```')[0].trim() : '',
            usage: {
                tokens: tokensUsed,
                credits: creditsUsed,
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
