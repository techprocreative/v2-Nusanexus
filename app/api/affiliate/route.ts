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

        const { data: affiliate, error } = await supabase
            .from('affiliates')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching affiliate:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ affiliate: affiliate || null });
    } catch (error: any) {
        console.error('Error in affiliate GET:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if affiliate already exists
        const { data: existing } = await supabase
            .from('affiliates')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { error: 'Affiliate profile already exists' },
                { status: 400 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const { code: customCode } = body as { code?: string };

        const baseCode =
            customCode && typeof customCode === 'string'
                ? customCode.trim().toLowerCase()
                : `nusa-${user.id.slice(0, 8)}`;

        const code = baseCode.replace(/[^a-z0-9-_]/g, '');

        const { data: affiliate, error } = await supabase
            .from('affiliates')
            .insert({
                user_id: user.id,
                code,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating affiliate:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ affiliate });
    } catch (error: any) {
        console.error('Error in affiliate POST:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            payout_method,
            paypal_email,
            bank_requisites,
        } = body as {
            payout_method?: 'paypal' | 'bank_transfer';
            paypal_email?: string;
            bank_requisites?: string;
        };

        const updates: Record<string, any> = {};

        if (payout_method === 'paypal' || payout_method === 'bank_transfer') {
            updates.payout_method = payout_method;
        }

        if (typeof paypal_email === 'string') {
            updates.paypal_email = paypal_email;
        }

        if (typeof bank_requisites === 'string') {
            updates.bank_requisites = bank_requisites;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            );
        }

        const { data: affiliate, error } = await supabase
            .from('affiliates')
            .update(updates)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating affiliate:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ affiliate });
    } catch (error: any) {
        console.error('Error in affiliate PATCH:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}