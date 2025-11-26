import { createClient, createServiceClient } from '@/lib/supabase/server';
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
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get user details from profiles + current workspace
        const { data: userData, error } = await supabase
            .from('profiles')
            .select('*, workspaces!current_workspace_id(*)')
            .eq('id', params.id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Get auth user info (email, last_sign_in_at) via service client
        const service = createServiceClient();
        const { data: authData, error: authError } = await service.auth.admin.getUserById(params.id);

        if (authError) {
            console.error('Error fetching auth user:', authError);
        }

        const enrichedUser = {
            ...userData,
            email: authData?.user?.email ?? null,
            last_sign_in_at: authData?.user?.last_sign_in_at ?? null,
        };

        // Get user's subscriptions (legacy subscriptions table + plans)
        const { data: subscriptions } = await supabase
            .from('subscriptions')
            .select('*, plans(*)')
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
            user: enrichedUser,
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
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { status, role, creditAdjustment, workspaceId } = body;

        const updates: any = {};

        if (status) {
            updates.status = status;
        }
        if (role) {
            updates.role = role;
        }

        // Update user profile
        if (Object.keys(updates).length > 0) {
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', params.id);

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }
        }

        // Handle credit adjustment
        if (typeof creditAdjustment === 'number' && workspaceId) {
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
                        .update({
                            credit_count: (workspace.credit_count || 0) + creditAdjustment,
                        })
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

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const service = createServiceClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Delete from auth.users via admin API
        const { error: authError } = await service.auth.admin.deleteUser(params.id);

        if (authError) {
            console.error('Error deleting auth user:', authError);
            return NextResponse.json(
                { error: authError.message || 'Failed to delete auth user' },
                { status: 500 }
            );
        }

        // Profiles row should be removed by cascade if configured; ensure cleanup just in case
        await supabase.from('profiles').delete().eq('id', params.id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
} catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
