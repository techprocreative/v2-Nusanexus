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
            .from('credit_packages')
            .select('*')
            .order('sort_order', { ascending: true });

        if (!includeInactive) {
            query = query.eq('is_active', true);
        }

        const { data: packages, error } = await query;

        if (error) {
            console.error('Error fetching credit packages:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ packages: packages || [] });
    } catch (error: any) {
        console.error('Error in admin credits GET:', error);
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
            credits,
            price,
            discount_percentage,
            is_active,
            sort_order,
        } = body as {
            name: string;
            credits: number;
            price: number;
            discount_percentage?: number;
            is_active?: boolean;
            sort_order?: number;
        };

        if (!name || typeof credits !== 'number' || typeof price !== 'number') {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const { data: pkg, error } = await supabase
            .from('credit_packages')
            .insert({
                name,
                credits,
                price,
                discount_percentage: discount_percentage ?? 0,
                is_active: is_active ?? true,
                sort_order: sort_order ?? 0,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating credit package:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ package: pkg });
    } catch (error: any) {
        console.error('Error in admin credits POST:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}