import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { encrypt } from '@/lib/ai/encryption';

export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get all providers
        const { data: providers, error } = await supabase
            .from('ai_providers')
            .select('*')
            .order('type')
            .order('priority', { ascending: false });

        if (error) throw error;

        // Don't send encrypted API keys to client
        const providersWithoutKeys = providers?.map(p => ({
            ...p,
            api_key_encrypted: undefined,
            has_api_key: !!p.api_key_encrypted,
        }));

        return NextResponse.json(providersWithoutKeys || []);
    } catch (error: any) {
        console.error('Error fetching providers:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch providers' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, display_name, type, base_url, api_key, status, priority, config } = body;

        // Validate required fields
        if (!name || !display_name || !type || !base_url || !api_key) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Encrypt API key
        const api_key_encrypted = encrypt(api_key);

        // Create provider
        const { data: provider, error } = await supabase
            .from('ai_providers')
            .insert({
                name,
                display_name,
                type,
                base_url,
                api_key_encrypted,
                status: status ?? 1,
                priority: priority ?? 0,
                config: config || {},
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            ...provider,
            api_key_encrypted: undefined,
            has_api_key: true,
        });
    } catch (error: any) {
        console.error('Error creating provider:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create provider' },
            { status: 500 }
        );
    }
}
