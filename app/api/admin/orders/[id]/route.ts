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

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { supabase, errorResponse } = await requireAdmin();
        if (errorResponse) return errorResponse;

        const body = await request.json();
        const { is_paid, is_fulfilled, external_id } = body;

        const updates: any = {};

        if (typeof is_paid === 'boolean') updates.is_paid = is_paid;
        if (typeof is_fulfilled === 'boolean') updates.is_fulfilled = is_fulfilled;
        if (typeof external_id === 'string') updates.external_id = external_id;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const { data: order, error } = await supabase
            .from('orders')
            .update(updates)
            .eq('id', params.id)
            .select(
                `
        *,
        workspace:workspaces(id, name),
        plan_snapshot:plan_snapshots(id, title),
        coupon:coupons(id, code)
      `
            )
            .single();

        if (error) {
            console.error('Error updating order:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ order });
    } catch (error: any) {
        console.error('Error in admin order PATCH:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}