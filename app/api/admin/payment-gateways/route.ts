import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { encryptPaymentCredentials } from '@/lib/payment/encryption';

export async function GET(request: Request) {
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

        const { data: gateways, error } = await supabase
            .from('payment_gateways')
            .select('id, name, display_name, is_active, is_sandbox, settings, created_at, updated_at')
            .order('display_name');

        if (error) {
            console.error('Error fetching payment gateways:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ gateways });
    } catch (error: any) {
        console.error('Error in payment gateways API:', error);
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
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { name, displayName, credentials, isSandbox, settings } = body;

        if (!name || !displayName || !credentials) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Encrypt credentials
        const credentialsEncrypted = encryptPaymentCredentials(credentials);

        const { data: gateway, error } = await supabase
            .from('payment_gateways')
            .insert({
                name,
                display_name: displayName,
                credentials_encrypted: credentialsEncrypted,
                is_sandbox: isSandbox || false,
                settings: settings || {},
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating payment gateway:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ gateway });
    } catch (error: any) {
        console.error('Error in create payment gateway API:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
