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

        const { data: assistants, error } = await supabase
            .from('assistants')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching assistants:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ assistants: assistants ?? [] });
    } catch (error: any) {
        console.error('Error in admin assistants GET:', error);
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
            expertise,
            description,
            instructions,
            avatar_url,
            model = 'gpt-4',
            status = 1,
            config,
        } = body;

        if (!name) {
            return NextResponse.json({ error: 'name is required' }, { status: 400 });
        }

        const payload: any = {
            name,
            expertise,
            description,
            instructions,
            avatar_url,
            model,
            status,
        };

        if (config && typeof config === 'object') {
            payload.config = config;
        }

        const { data: assistant, error } = await supabase
            .from('assistants')
            .insert(payload)
            .select('*')
            .single();

        if (error) {
            console.error('Error creating assistant:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ assistant });
    } catch (error: any) {
        console.error('Error in admin assistants POST:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}