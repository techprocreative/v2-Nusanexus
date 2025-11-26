import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

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

        // Check admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const serviceClient = createServiceClient();

        // Get workspace
        const {
            data: workspace,
            error: workspaceError,
        } = await serviceClient
            .from('workspaces')
            .select('id, name, credit_count, is_trialed, owner_id, created_at, updated_at')
            .eq('id', params.id)
            .single();

        if (workspaceError || !workspace) {
            return NextResponse.json(
                { error: workspaceError?.message || 'Workspace not found' },
                { status: 404 }
            );
        }

        // Get owner profile (if any)
        let owner: any = null;
        if (workspace.owner_id) {
            const { data: ownerProfile } = await serviceClient
                .from('profiles')
                .select('id, first_name, last_name, status, role')
                .eq('id', workspace.owner_id)
                .single();

            owner = ownerProfile || null;
        }

        // Get workspace members
        const { data: members } = await serviceClient
            .from('workspace_members')
            .select('user_id, role, joined_at')
            .eq('workspace_id', params.id);

        // Get subscriptions for this workspace
        const { data: subscriptions } = await serviceClient
            .from('subscriptions')
            .select('id, status, current_period_start, current_period_end, subscription_plans(display_name, price, monthly_credits)')
            .eq('workspace_id', params.id)
            .order('created_at', { ascending: false });

        // Get recent transactions for this workspace
        const { data: transactions } = await serviceClient
            .from('payment_transactions')
            .select('id, type, amount, status, created_at, payment_gateways(display_name)')
            .eq('workspace_id', params.id)
            .order('created_at', { ascending: false })
            .limit(10);

        return NextResponse.json({
            workspace,
            owner,
            members: members || [],
            subscriptions: subscriptions || [],
            transactions: transactions || [],
        });
    } catch (error: any) {
        console.error('Error fetching workspace details:', error);
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

        // Check admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const {
            name,
            is_trialed,
            creditAdjustment,
        } = body as {
            name?: string;
            is_trialed?: boolean;
            creditAdjustment?: number;
        };

        const serviceClient = createServiceClient();
        const updates: Record<string, any> = {};

        if (typeof name === 'string') {
            updates.name = name;
        }

        if (typeof is_trialed === 'boolean') {
            updates.is_trialed = is_trialed;
        }

        if (typeof creditAdjustment === 'number' && creditAdjustment !== 0) {
            const {
                data: workspace,
                error: workspaceError,
            } = await serviceClient
                .from('workspaces')
                .select('credit_count')
                .eq('id', params.id)
                .single();

            if (workspaceError || !workspace) {
                return NextResponse.json(
                    { error: workspaceError?.message || 'Workspace not found' },
                    { status: 404 }
                );
            }

            const currentCredits = Number(workspace.credit_count || 0);
            updates.credit_count = currentCredits + creditAdjustment;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No valid updates provided' },
                { status: 400 }
            );
        }

        const {
            data: updatedWorkspace,
            error: updateError,
        } = await serviceClient
            .from('workspaces')
            .update(updates)
            .eq('id', params.id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating workspace:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ workspace: updatedWorkspace });
    } catch (error: any) {
        console.error('Error updating workspace:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}