import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function requireAdmin() {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { supabase, errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { supabase, errorResponse: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }

    return { supabase, errorResponse: null as NextResponse | null };
}

export async function GET(request: Request) {
    try {
        const { supabase, errorResponse } = await requireAdmin();
        if (errorResponse) return errorResponse;

        const { searchParams } = new URL(request.url);
        const isPaidParam = searchParams.get('is_paid');
        const isFulfilledParam = searchParams.get('is_fulfilled');
        const workspaceId = searchParams.get('workspaceId');

        let query = supabase
            .from('orders')
            .select(
                `
        *,
        workspace:workspaces(id, name),
        plan_snapshot:plan_snapshots(id, title),
        coupon:coupons(id, code)
      `
            )
            .order('created_at', { ascending: false });

        if (isPaidParam === 'true' || isPaidParam === 'false') {
            query = query.eq('is_paid', isPaidParam === 'true');
        }

        if (isFulfilledParam === 'true' || isFulfilledParam === 'false') {
            query = query.eq('is_fulfilled', isFulfilledParam === 'true');
        }

        if (workspaceId) {
            query = query.eq('workspace_id', workspaceId);
        }

        const { data: orders, error } = await query;

        if (error) {
            console.error('Error fetching orders:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ orders: orders ?? [] });
    } catch (error: any) {
        console.error('Error in admin orders GET:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}