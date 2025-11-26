import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { encryptPaymentCredentials } from '@/lib/payment/encryption';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

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
        const { displayName, credentials, isActive, isSandbox, settings } = body;

        const updateData: any = {};

        if (displayName) updateData.display_name = displayName;
        if (typeof isActive === 'boolean') updateData.is_active = isActive;
        if (typeof isSandbox === 'boolean') updateData.is_sandbox = isSandbox;
        if (settings) updateData.settings = settings;

        // Only encrypt and update credentials if provided
        if (credentials) {
            updateData.credentials_encrypted = encryptPaymentCredentials(credentials);
        }

        const { data: gateway, error } = await supabase
            .from('payment_gateways')
            .update(updateData)
            .eq('id', params.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating payment gateway:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ gateway });
    } catch (error: any) {
        console.error('Error in update payment gateway API:', error);
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
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

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

        const { error } = await supabase
            .from('payment_gateways')
            .delete()
            .eq('id', params.id);

        if (error) {
            console.error('Error deleting payment gateway:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error in delete payment gateway API:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
