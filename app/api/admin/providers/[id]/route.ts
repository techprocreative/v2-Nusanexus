import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { encrypt } from '@/lib/ai/encryption';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { data: provider, error } = await supabase
            .from('ai_providers')
            .select('*')
            .eq('id', params.id)
            .single();

        if (error) throw error;

        return NextResponse.json({
            ...provider,
            api_key_encrypted: undefined,
            has_api_key: !!provider.api_key_encrypted,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to fetch provider' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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
            display_name,
            base_url,
            api_key,
            status,
            priority,
            config,
            markup_multiplier,
        } = body;

        const updateData: any = {};

        if (display_name !== undefined) updateData.display_name = display_name;
        if (base_url !== undefined) updateData.base_url = base_url;
        if (status !== undefined) updateData.status = status;
        if (priority !== undefined) updateData.priority = priority;

        // Merge existing config with incoming config and markup multiplier if provided
        if (config !== undefined || markup_multiplier !== undefined) {
            const { data: existing } = await supabase
                .from('ai_providers')
                .select('config')
                .eq('id', params.id)
                .single();

            const mergedConfig = {
                ...(existing?.config || {}),
                ...(config || {}),
                ...(markup_multiplier !== undefined ? { markup_multiplier } : {}),
            };

            updateData.config = mergedConfig;
        }

        // Only encrypt and update API key if provided
        if (api_key) {
            updateData.api_key_encrypted = encrypt(api_key);
        }

        const { data: provider, error } = await supabase
            .from('ai_providers')
            .update(updateData)
            .eq('id', params.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            ...provider,
            api_key_encrypted: undefined,
            has_api_key: true,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to update provider' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { error } = await supabase
            .from('ai_providers')
            .delete()
            .eq('id', params.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to delete provider' },
            { status: 500 }
        );
    }
}
