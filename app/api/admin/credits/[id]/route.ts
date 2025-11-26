import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
            credits,
            price,
            discount_percentage,
            is_active,
            sort_order,
        } = body as {
            name?: string;
            credits?: number;
            price?: number;
            discount_percentage?: number;
            is_active?: boolean;
            sort_order?: number;
        };

        const updates: Record<string, any> = {};

        if (typeof name === 'string') updates.name = name;
        if (typeof credits === 'number') updates.credits = credits;
        if (typeof price === 'number') updates.price = price;
        if (typeof discount_percentage === 'number') {
            updates.discount_percentage = discount_percentage;
        }
        if (typeof is_active === 'boolean') updates.is_active = is_active;
        if (typeof sort_order === 'number') updates.sort_order = sort_order;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        const {
            data: pkg,
            error,
        } = await supabase
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
        console.error('Error in admin credit PATCH:', error);
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

        const { error } = await supabase
            .from('credit_packages')
            .delete()
            .eq('id', params.id);

        if (error) {
            console.error('Error deleting credit package:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in admin credit DELETE:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}