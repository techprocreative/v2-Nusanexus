import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    try {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role using profiles
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const serviceClient = createServiceClient();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const type = searchParams.get('type');

        let query = serviceClient
            .from('payment_transactions')
            .select('*, credit_packages(name, credits), payment_gateways(display_name)')
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        if (type) {
            query = query.eq('type', type);
        }

        const { data: transactions, error } = await query;

        if (error) {
            console.error('Error fetching admin transactions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ transactions: transactions || [] });
    } catch (error: any) {
        console.error('Error in admin transactions API:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}