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

        let query = supabase
            .from('payouts')
            .select(
                `
                *,
                affiliates(code, user_id, profiles(first_name, last_name))
            `
            )
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data: payouts, error } = await query;

        if (error) {
            console.error('Error fetching payouts:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ payouts: payouts || [] });
    } catch (error: any) {
        console.error('Error in admin payouts GET:', error);
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

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { id, status, notes } = body as {
            id: string;
            status?: 'pending' | 'processing' | 'completed' | 'rejected';
            notes?: string;
        };

        if (!id) {
            return NextResponse.json(
                { error: 'Payout ID is required' },
                { status: 400 }
            );
        }

        const updates: Record<string, any> = {};
        if (status) updates.status = status;
        if (typeof notes === 'string') updates.notes = notes;

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: 'No fields to update' },
                { status: 400 }
            );
        }

        const { data: payout, error } = await supabase
            .from('payouts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating payout:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // If status is completed, move amount from pending to withdrawn on affiliate
        if (status === 'completed') {
            const { data: existing } = await supabase
                .from('payouts')
                .select('affiliate_id, amount')
                .eq('id', id)
                .single();

            if (existing) {
                const { data: affiliate } = await supabase
                    .from('affiliates')
                    .select('*')
                    .eq('id', existing.affiliate_id)
                    .single();

                if (affiliate) {
                    await supabase
                        .from('affiliates')
                        .update({
                            pending_amount:
                                (affiliate.pending_amount || 0) - existing.amount,
                            withdrawn_amount:
                                (affiliate.withdrawn_amount || 0) + existing.amount,
                        })
                        .eq('id', affiliate.id);
                }
            }
        }

        return NextResponse.json({ payout });
    } catch (error: any) {
        console.error('Error in admin payouts PATCH:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}