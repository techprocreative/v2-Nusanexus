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

export async function GET() {
    try {
        const { supabase, errorResponse } = await requireAdmin();
        if (errorResponse) return errorResponse;

        const { data: plans, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching subscription plans:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ plans: plans ?? [] });
    } catch (error: any) {
        console.error('Error in admin subscription plans GET:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
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
            is_active = true,
            sort_order = 0,
        } = body;

        if (!name || !display_name) {
            return NextResponse.json(
                { error: 'name and display_name are required' },
                { status: 400 }
            );
        }

        if (typeof monthly_credits !== 'number' || typeof price !== 'number') {
            return NextResponse.json(
                { error: 'monthly_credits and price must be numbers' },
                { status: 400 }
            );
        }

        const payload: any = {
            name,
            display_name,
            monthly_credits,
            price,
            is_active,
            sort_order,
        };

        if (Array.isArray(features)) {
            payload.features = features;
        }

        const { data: plan, error } = await supabase
            .from('subscription_plans')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error('Error creating subscription plan:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ plan });
    } catch (error: any) {
        console.error('Error in admin subscription plans POST:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}