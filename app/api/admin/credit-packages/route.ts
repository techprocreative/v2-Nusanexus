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

        const { data: packages, error } = await supabase
            .from('credit_packages')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching credit packages:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ packages: packages ?? [] });
    } catch (error: any) {
        console.error('Error in admin credit packages GET:', error);
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
            credits,
            price,
            discount_percentage = 0,
            is_active = true,
            sort_order = 0,
        } = body;

        if (!name) {
            return NextResponse.json({ error: 'name is required' }, { status: 400 });
        }

        if (typeof credits !== 'number' || typeof price !== 'number') {
            return NextResponse.json(
                { error: 'credits and price must be numbers' },
                { status: 400 }
            );
        }

        const payload = {
            name,
            credits,
            price,
            discount_percentage,
            is_active,
            sort_order,
        };

        const { data: pkg, error } = await supabase
            .from('credit_packages')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error('Error creating credit package:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ package: pkg });
    } catch (error: any) {
        console.error('Error in admin credit packages POST:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}