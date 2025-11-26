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
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select('*, owner_profile:profiles!owner_id(id, first_name, last_name)')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching workspace:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Members
    const { data: members } = await supabase
      .from('workspace_members')
      .select('*, profile:profiles(id, first_name, last_name)')
      .eq('workspace_id', params.id)
      .order('created_at', { ascending: true });

    // Subscriptions (Tripay/Midtrans billing schema)
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*, subscription_plans(*)')
      .eq('workspace_id', params.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      workspace,
      members: members || [],
      subscriptions: subscriptions || [],
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
    const { creditAdjustment } = body;

    if (typeof creditAdjustment !== 'number') {
      return NextResponse.json(
        { error: 'creditAdjustment must be a number' },
        { status: 400 }
      );
    }

    // Try RPC if exists
    const { error: rpcError } = await supabase.rpc('adjust_workspace_credits', {
      workspace_id: params.id,
      amount: creditAdjustment,
    });

    if (rpcError) {
      // Fallback to direct update
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('credit_count')
        .eq('id', params.id)
        .single();

      if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }

      const { error } = await supabase
        .from('workspaces')
        .update({
          credit_count: (workspace.credit_count || 0) + creditAdjustment,
        })
        .eq('id', params.id);

      if (error) {
        console.error('Error updating workspace credits:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating workspace:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}