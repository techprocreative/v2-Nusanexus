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
        const {
            name,
            display_name,
            monthly_credits,
            price,
            features,
            is_active,
            sort_order,
        } = body;

        const updates: any = {};

        if (typeof name === 'string') updates.name = name;
        if (typeof display_name === 'string') updates.display_name = display_name;
        if (typeof monthly_credits === 'number') updates.monthly_credits = monthly_credits;
        if (typeof price === 'number') updates.price = price;
        if (Array.isArray(features)) updates.features = features;
        if (typeof is_active === 'boolean') updates.is_active = is_active;
        if (typeof sort_order === 'number') updates.sort_order = sort_order;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const { data: plan, error } = await supabase
            .from('subscription_plans')
            .update(updates)
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating subscription plan:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ plan });
    } catch (error: any) {
        console.error('Error in admin subscription plan PATCH:', error);
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
        const { supabase, errorResponse } = await requireAdmin();
        if (errorResponse) return errorResponse;

        // Soft-delete: mark plan as inactive instead of removing to preserve history/FKs
        const { error } = await supabase
            .from('subscription_plans')
            .update({ is_active: false })
            .eq('id', params.id);

        if (error) {
            console.error('Error disabling subscription plan:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in admin subscription plan DELETE:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}