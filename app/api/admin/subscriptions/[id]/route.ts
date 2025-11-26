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
        const { status, cancel_at_period_end, current_period_end } = body;

        const updates: any = {};

        if (typeof status === 'string') {
            updates.status = status;
        }

        if (typeof cancel_at_period_end === 'boolean') {
            updates.cancel_at_period_end = cancel_at_period_end;

            if (!cancel_at_period_end) {
                // If resuming, clear canceled_at
                updates.canceled_at = null;
            }
        }

        if (typeof current_period_end === 'string') {
            updates.current_period_end = current_period_end;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const { data: subscription, error } = await supabase
            .from('subscriptions')
            .update(updates)
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating subscription:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ subscription });
    } catch (error: any) {
        console.error('Error in admin subscription PATCH:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}