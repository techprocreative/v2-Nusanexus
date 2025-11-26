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

        const { data: voices, error } = await supabase
            .from('voices')
            .select('*')
            .order('provider', { ascending: true })
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching voices:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ voices: voices ?? [] });
    } catch (error: any) {
        console.error('Error in admin voices GET:', error);
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
            provider,
            model,
            external_id,
            name,
            status = 1,
            gender,
            accent,
            age,
            tone,
            use_case,
            sample_url,
            supported_languages,
        } = body;

        if (!provider || !model || !external_id || !name) {
            return NextResponse.json(
                { error: 'provider, model, external_id and name are required' },
                { status: 400 }
            );
        }

        const payload: any = {
            provider,
            model,
            external_id,
            name,
            status,
            gender,
            accent,
            age,
            tone,
            use_case,
            sample_url,
        };

        if (Array.isArray(supported_languages)) {
            payload.supported_languages = supported_languages;
        }

        const { data: voice, error } = await supabase
            .from('voices')
            .insert(payload)
            .select('*')
            .single();

        if (error) {
            console.error('Error creating voice:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ voice });
    } catch (error: any) {
        console.error('Error in admin voices POST:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}