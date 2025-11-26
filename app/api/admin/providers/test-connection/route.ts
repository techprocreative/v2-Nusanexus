import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { testProviderConnection } from '@/lib/ai/provider-client';

export async function POST(request: Request) {
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
        const { base_url, api_key } = body;

        if (!base_url || !api_key) {
            return NextResponse.json(
                { error: 'Missing base_url or api_key' },
                { status: 400 }
            );
        }

        const result = await testProviderConnection(base_url, api_key);

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Connection test failed' },
            { status: 500 }
        );
    }
}
