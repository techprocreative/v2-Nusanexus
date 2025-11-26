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
        const { conversationId, message, model = 'gpt-3.5-turbo' } = body;

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
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

        // Get or create conversation
        let conversation;
        if (conversationId) {
            const { data } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', conversationId)
                .single();
            conversation = data;
        } else {
            const { data, error } = await supabase
                .from('conversations')
                .insert({
                    workspace_id: profile.current_workspace_id,
                    user_id: user.id,
                    title: message.slice(0, 100),
                    model,
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating conversation:', error);
                return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
            }
            conversation = data;
        }

        // Get conversation history
        const { data: messages } = await supabase
            .from('messages')
            .select('role, content')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: true });

        // Build messages array
        const chatMessages = [
            ...(messages || []).map((m: any) => ({ role: m.role, content: m.content })),
            { role: 'user', content: message },
        ];

        // Get AI client
        const openai = await getAIClient('llm');

        // Generate response
        const completion = await openai.chat.completions.create({
            model,
            messages: chatMessages as any,
            max_tokens: 1000,
        });

        const assistantMessage = completion.choices[0]?.message?.content ?? '';
        const tokensUsed = completion.usage?.total_tokens ?? 0;
        const creditsUsed = Math.ceil(tokensUsed / 1000);

        // Save user message
        await supabase.from('messages').insert({
            conversation_id: conversation.id,
            role: 'user',
            content: message,
        });

        // Save assistant message
        await supabase.from('messages').insert({
            conversation_id: conversation.id,
            role: 'assistant',
            content: assistantMessage,
        });

        // Update conversation
        await supabase
            .from('conversations')
            .update({
                message_count: (conversation.message_count || 0) + 2,
                total_credit_count: (conversation.total_credit_count || 0) + creditsUsed,
            })
            .eq('id', conversation.id);

        // Deduct credits
        await supabase
            .from('workspaces')
            .update({
                credit_count: (workspace.credit_count ?? 0) - creditsUsed,
            })
            .eq('id', profile.current_workspace_id);

        return NextResponse.json({
            success: true,
            conversationId: conversation.id,
            message: assistantMessage,
            usage: {
                tokens: tokensUsed,
                credits: creditsUsed,
            },
        });
    } catch (error: any) {
        console.error('Chat error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to send message' },
            { status: 500 }
        );
    }
}
