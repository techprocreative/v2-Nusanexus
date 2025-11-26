import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (currentProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get user profile + current workspace
        const {
            data: userData,
            error: userError,
        } = await supabase
            .from('profiles')
            .select('*, workspaces!current_workspace_id(id, name, credit_count)')
            .eq('id', params.id)
            .single();

        if (userError || !userData) {
            return NextResponse.json(
                { error: userError?.message || 'User not found' },
                { status: 404 }
            );
        }

        // Get user's subscriptions (for current workspace)
        const { data: subscriptions } = await supabase
            .from('subscriptions')
            .select('*, subscription_plans(*)')
            .eq('workspace_id', userData.current_workspace_id)
            .order('created_at', { ascending: false });

        // Get user's transactions
        const { data: transactions } = await supabase
            .from('payment_transactions')
            .select('*')
            .eq('user_id', params.id)
            .order('created_at', { ascending: false })
            .limit(10);

        return NextResponse.json({
            user: userData,
            subscriptions: subscriptions || [],
            transactions: transactions || [],
        });
    } catch (error: any) {
        console.error('Error fetching user details:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (currentProfile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { status, creditAdjustment, workspaceId } = body as {
            status?: string;
            creditAdjustment?: number;
            workspaceId?: string;
        };

        const updates: Record<string, any> = {};

        if (status) {
            updates.status = status;
        }

        // Update user profile
        if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', params.id);

            if (updateError) {
                return NextResponse.json(
                    { error: updateError.message },
                    { status: 500 }
                );
            }
        }

        // Handle credit adjustment
        if (typeof creditAdjustment === 'number' && workspaceId) {
            const {
                data: workspace,
                error: workspaceError,
            } = await supabase
                .from('workspaces')
                .select('credit_count')
                .eq('id', workspaceId)
                .single();

            if (!workspaceError && workspace) {
                const currentCredits = Number(workspace.credit_count || 0);
                const newCredits = currentCredits + creditAdjustment;

                const { error: creditError } = await supabase
                    .from('workspaces')
                    .update({ credit_count: newCredits })
                    .eq('id', workspaceId);

                if (creditError) {
                    return NextResponse.json(
                        { error: creditError.message },
                        { status: 500 }
                    );
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
