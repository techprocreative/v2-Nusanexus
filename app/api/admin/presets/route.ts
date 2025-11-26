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

export async function GET(request: Request) {
    try {
        const { supabase, errorResponse } = await requireAdmin();
        if (errorResponse) return errorResponse;

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const categoryId = searchParams.get('category_id');
        const includeInactive = searchParams.get('include_inactive') === 'true';

        let query = supabase
            .from('presets')
            .select(
                `
        *,
        category:categories(id, title)
      `
            );

        if (!includeInactive) {
            query = query.eq('status', 1);
        }

        if (type) {
            query = query.eq('type', type);
        }

        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }

        query = query.order('created_at', { ascending: false });

        const { data: presets, error } = await query;

        if (error) {
            console.error('Error fetching presets (admin):', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ presets: presets ?? [] });
    } catch (error: any) {
        console.error('Error in admin presets GET:', error);
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
            title,
            description,
            type,
            category_id,
            template,
            image,
            color,
            status = 1,
            is_locked = false,
            config,
        } = body;

        if (!title || !type) {
            return NextResponse.json(
                { error: 'title and type are required' },
                { status: 400 }
            );
        }

        const payload: any = {
            title,
            description,
            type,
            category_id: category_id || null,
            template,
            image,
            color,
            status,
            is_locked,
        };

        if (config && typeof config === 'object') {
            payload.config = config;
        }

        const { data: preset, error } = await supabase
            .from('presets')
            .insert(payload)
            .select(
                `
        *,
        category:categories(id, title)
      `
            )
            .single();

        if (error) {
            console.error('Error creating preset:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ preset });
    } catch (error: any) {
        console.error('Error in admin presets POST:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}