import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

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

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        // Status filter can be 'active' (has balance or referrals) or 'all'
        let query = supabase
            .from('affiliates')
            .select('*, profiles(first_name, last_name)')
            .order('created_at', { ascending: false });

        if (status === 'active') {
            query = query.or('referral_count.gt.0,balance_amount.gt.0');
        }

        const { data: affiliates, error } = await query;

        if (error) {
            console.error('Error fetching affiliates:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ affiliates: affiliates || [] });
    } catch (error: any) {
        console.error('Error in admin affiliates GET:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}