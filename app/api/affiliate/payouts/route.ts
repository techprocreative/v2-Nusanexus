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

        const { data: affiliate } = await supabase
            .from('affiliates')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!affiliate) {
            return NextResponse.json({ payouts: [] });
        }

        const { data: payouts, error } = await supabase
            .from('payouts')
            .select('*')
            .eq('affiliate_id', affiliate.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching payouts:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ payouts: payouts || [] });
    } catch (error: any) {
        console.error('Error in affiliate payouts GET:', error);
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

        const body = await request.json().catch(() => ({}));
        const { amount, notes } = body as { amount?: number; notes?: string };

        if (!amount || amount <= 0) {
            return NextResponse.json(
                { error: 'Invalid payout amount' },
                { status: 400 }
            );
        }

        // Get affiliate
        const { data: affiliate, error: affError } = await supabase
            .from('affiliates')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (affError || !affiliate) {
            return NextResponse.json(
                { error: affError?.message || 'Affiliate not found' },
                { status: 404 }
            );
        }

        const currentBalance = affiliate.balance_amount || 0;

        if (amount > currentBalance) {
            return NextResponse.json(
                { error: 'Requested amount exceeds available balance' },
                { status: 400 }
            );
        }

        // Create payout request
        const { data: payout, error: payoutError } = await supabase
            .from('payouts')
            .insert({
                affiliate_id: affiliate.id,
                amount,
                status: 'pending',
                notes: notes || null,
            })
            .select()
            .single();

        if (payoutError) {
            console.error('Error creating payout:', payoutError);
            return NextResponse.json({ error: payoutError.message }, { status: 500 });
        }

        // Update affiliate balances: move from balance to pending
        const { error: updateError } = await supabase
            .from('affiliates')
            .update({
                balance_amount: currentBalance - amount,
                pending_amount: (affiliate.pending_amount || 0) + amount,
            })
            .eq('id', affiliate.id);

        if (updateError) {
            console.error('Error updating affiliate balance:', updateError);
        }

        return NextResponse.json({ payout });
    } catch (error: any) {
        console.error('Error in affiliate payouts POST:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}