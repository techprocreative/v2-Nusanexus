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

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const language = formData.get('language') as string;

        if (!file) {
            return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
        }

        // Check workspace credits
        const { data: workspace } = await supabase
            .from('workspaces')
            .select('credit_count')
            .eq('id', profile.current_workspace_id)
            .single();

        const creditsNeeded = 5; // Fixed cost for transcription
        if (!workspace || (workspace.credit_count ?? 0) < creditsNeeded) {
            return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
        }

        // Get AI client
        const openai = await getAIClient('transcription');

        // Transcribe audio
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: 'whisper-1',
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
                model: 'whisper-1',
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
