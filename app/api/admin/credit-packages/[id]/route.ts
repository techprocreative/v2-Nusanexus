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
            credits,
            price,
            discount_percentage,
            is_active,
            sort_order,
        } = body;

        const updates: any = {};

        if (typeof name === 'string') updates.name = name;
        if (typeof credits === 'number') updates.credits = credits;
        if (typeof price === 'number') updates.price = price;
        if (typeof discount_percentage === 'number') updates.discount_percentage = discount_percentage;
        if (typeof is_active === 'boolean') updates.is_active = is_active;
        if (typeof sort_order === 'number') updates.sort_order = sort_order;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const { data: pkg, error } = await supabase
            .from('credit_packages')
            .update(updates)
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating credit package:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ package: pkg });
    } catch (error: any) {
        console.error('Error in admin credit package PATCH:', error);
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

        // Soft-delete: mark package as inactive
        const { error } = await supabase
            .from('credit_packages')
            .update({ is_active: false })
            .eq('id', params.id);

        if (error) {
            console.error('Error disabling credit package:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in admin credit package DELETE:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}