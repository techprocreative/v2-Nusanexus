import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
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

        const { searchParams } = new URL(request.url);
        const includeInactive = searchParams.get('include_inactive') === 'true';

        let query = supabase
            .from('subscription_plans')
            .select('*')
            .order('sort_order', { ascending: true });

        if (!includeInactive) {
            query = query.eq('is_active', true);
        }

        const { data: plans, error } = await query;

        if (error) {
            console.error('Error fetching subscription plans:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ plans: plans || [] });
    } catch (error: any) {
        console.error('Error in admin plans GET:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
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
            display_name,
            monthly_credits,
            price,
            features,
            is_active,
            sort_order,
        } = body as {
            name: string;
            display_name: string;
            monthly_credits: number;
            price: number;
            features?: string[];
            is_active?: boolean;
            sort_order?: number;
        };

        if (!name || !display_name || typeof monthly_credits !== 'number' || typeof price !== 'number') {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { data: plan, error } = await supabase
            .from('subscription_plans')
            .insert({
                name,
                display_name,
                monthly_credits,
                price,
                features: Array.isArray(features) ? features : [],
                is_active: is_active ?? true,
                sort_order: sort_order ?? 0,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating subscription plan:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ plan });
    } catch (error: any) {
        console.error('Error in admin plans POST:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}