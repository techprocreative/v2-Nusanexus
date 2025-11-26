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
            supported_languages,
        } = body;

        const updates: any = {};

        if (typeof provider === 'string') updates.provider = provider;
        if (typeof model === 'string') updates.model = model;
        if (typeof external_id === 'string') updates.external_id = external_id;
        if (typeof name === 'string') updates.name = name;
        if (typeof status === 'number') updates.status = status;
        if (typeof gender === 'string' || gender === null) updates.gender = gender;
        if (typeof accent === 'string' || accent === null) updates.accent = accent;
        if (typeof age === 'string' || age === null) updates.age = age;
        if (typeof tone === 'string' || tone === null) updates.tone = tone;
        if (typeof use_case === 'string' || use_case === null) updates.use_case = use_case;
        if (typeof sample_url === 'string' || sample_url === null) updates.sample_url = sample_url;
        if (Array.isArray(supported_languages)) {
            updates.supported_languages = supported_languages;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const { data: voice, error } = await supabase
            .from('voices')
            .update(updates)
            .eq('id', params.id)
            .select('*')
            .single();

        if (error) {
            console.error('Error updating voice:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ voice });
    } catch (error: any) {
        console.error('Error in admin voice PATCH:', error);
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

        // Soft-delete by setting status = 0
        const { error } = await supabase
            .from('voices')
            .update({ status: 0 })
            .eq('id', params.id);

        if (error) {
            console.error('Error deleting voice:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in admin voice DELETE:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}