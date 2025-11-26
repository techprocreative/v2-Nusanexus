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
            title,
            description,
            type,
            category_id,
            template,
            image,
            color,
            status,
            is_locked,
            config,
        } = body;

        const updates: any = {};

        if (typeof title === 'string') updates.title = title;
        if (typeof description === 'string') updates.description = description;
        if (typeof type === 'string') updates.type = type;
        if (typeof category_id === 'string' || category_id === null) {
            updates.category_id = category_id;
        }
        if (typeof template === 'string') updates.template = template;
        if (typeof image === 'string') updates.image = image;
        if (typeof color === 'string') updates.color = color;
        if (typeof status === 'number') updates.status = status;
        if (typeof is_locked === 'boolean') updates.is_locked = is_locked;
        if (config && typeof config === 'object') updates.config = config;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
        }

        const { data: preset, error } = await supabase
            .from('presets')
            .update(updates)
            .eq('id', params.id)
            .select(
                `
        *,
        category:categories(id, title)
      `
            )
            .single();

        if (error) {
            console.error('Error updating preset:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ preset });
    } catch (error: any) {
        console.error('Error in admin preset PATCH:', error);
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
            .from('presets')
            .update({ status: 0 })
            .eq('id', params.id);

        if (error) {
            console.error('Error deleting preset:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in admin preset DELETE:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}