import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get user details
        const { data: userData, error } = await supabase
            .from('users')
            .select('*, workspaces!current_workspace_id(*)')
            .eq('id', params.id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get user's subscriptions
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
            subscriptions,
            transactions,
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
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { status, creditAdjustment, workspaceId } = body;

        const updates: any = {};

        if (status) {
            updates.status = status;
        }

        // Update user
        if (Object.keys(updates).length > 0) {
            const { error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', params.id);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
        }

        // Handle credit adjustment
        if (creditAdjustment && workspaceId) {
            const { error } = await supabase.rpc('adjust_workspace_credits', {
                workspace_id: workspaceId,
                amount: creditAdjustment,
            });

            if (error) {
                // Fallback to direct update
                const { data: workspace } = await supabase
                    .from('workspaces')
                    .select('credit_count')
                    .eq('id', workspaceId)
                    .single();

                if (workspace) {
                    await supabase
                        .from('workspaces')
                        .update({ credit_count: (workspace.credit_count || 0) + creditAdjustment })
                        .eq('id', workspaceId);
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
