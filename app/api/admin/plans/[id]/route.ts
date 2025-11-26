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
            display_name,
            monthly_credits,
            price,
            features,
            is_active,
            sort_order,
        } = body as {
            display_name?: string;
            monthly_credits?: number;
            price?: number;
            features?: string[];
            is_active?: boolean;
            sort_order?: number;
        };

        const updates: Record<string, any> = {};

        if (typeof display_name === 'string') updates.display_name = display_name;
        if (typeof monthly_credits === 'number') updates.monthly_credits = monthly_credits;
        if (typeof price === 'number') updates.price = price;
        if (Array.isArray(features)) updates.features = features;
        if (typeof is_active === 'boolean') updates.is_active = is_active;
        if (typeof sort_order === 'number') updates.sort_order = sort_order;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        const {
            data: plan,
            error,
        } = await supabase
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
        console.error('Error in admin plan PATCH:', error);
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
            .from('subscription_plans')
            .delete()
            .eq('id', params.id);

        if (error) {
            console.error('Error deleting subscription plan:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in admin plan DELETE:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}