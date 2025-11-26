import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get system settings from options table
        const { data: settings } = await supabase
            .from('options')
            .select('*');

        // Convert to key-value object
        const settingsObj = settings?.reduce((acc: any, setting: any) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {}) || {};

        return NextResponse.json({ settings: settingsObj });
    } catch (error: any) {
        console.error('Error fetching settings:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
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
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { settings } = body;

        // Update settings
        for (const [key, value] of Object.entries(settings)) {
            await supabase
                .from('options')
                .upsert({
                    key,
                    value,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'key',
                });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
