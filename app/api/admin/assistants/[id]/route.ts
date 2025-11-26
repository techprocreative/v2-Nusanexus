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
            name,
            expertise,
            description,
            instructions,
            avatar_url,
            model,
            status,
            config,
        } = body;

        const updates: any = {};

        if (typeof name === 'string') updates.name = name;
        if (typeof expertise === 'string' || expertise === null) updates.expertise = expertise;
        if (typeof description === 'string' || description === null) updates.description = description;
        if (typeof instructions === 'string' || instructions === null) updates.instructions = instructions;
        if (typeof avatar_url === 'string' || avatar_url === null) updates.avatar_url = avatar_url;
        if (typeof model === 'string') updates.model = model;
        if (typeof status === 'number') updates.status = status;
        if (config && typeof config === 'object') updates.config = config;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const { data: assistant, error } = await supabase
            .from('assistants')
            .update(updates)
            .eq('id', params.id)
            .select('*')
            .single();

        if (error) {
            console.error('Error updating assistant:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ assistant });
    } catch (error: any) {
        console.error('Error in admin assistant PATCH:', error);
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

        const { error } = await supabase
            .from('assistants')
            .delete()
            .eq('id', params.id);

        if (error) {
            console.error('Error deleting assistant:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in admin assistant DELETE:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}