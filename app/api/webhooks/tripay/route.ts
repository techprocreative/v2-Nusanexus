import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getPaymentGateway } from '@/lib/payment/gateway-factory';

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('x-callback-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        let data: any;
        try {
            data = JSON.parse(rawBody);
        } catch {
            return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
        }

        const supabase = createServiceClient();

        // Get transaction (service role bypasses RLS)
        const { data: transaction, error: txError } = await supabase
            .from('payment_transactions')
            .select('*, payment_gateways(*)')
            .eq('external_transaction_id', data.merchant_ref)
            .single();

        if (txError || !transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        // Verify signature using configured gateway
        const { client } = await getPaymentGateway(transaction.payment_gateway_id);
        const isValid = client.verifyCallback(signature, data);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Map Tripay status to internal status
        const newStatus =
            data.status === 'PAID'
                ? 'paid'
                : data.status === 'EXPIRED'
                ? 'expired'
                : data.status === 'FAILED'
                ? 'failed'
                : 'pending';

        // Update transaction status (idempotent on status)
        await supabase
            .from('payment_transactions')
            .update({
                status: newStatus,
                paid_at: newStatus === 'paid' ? new Date().toISOString() : transaction.paid_at,
                payment_method: data.payment_method,
            })
            .eq('id', transaction.id);

        // Only apply side effects once when transitioning to paid
        if (newStatus === 'paid' && transaction.status !== 'paid') {
            if (transaction.type === 'subscription') {
                // Activate subscription
                await supabase
                    .from('subscriptions')
                    .update({
                        status: 'active',
                        current_period_start: new Date().toISOString(),
                        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        external_subscription_id: data.reference,
                    })
                    .eq('id', transaction.subscription_id);

                // Allocate monthly credits
                const { data: subscription } = await supabase
                    .from('subscriptions')
                    .select('*, subscription_plans(monthly_credits)')
                    .eq('id', transaction.subscription_id)
                    .single();

                const monthlyCredits =
                    subscription?.subscription_plans?.monthly_credits ?? 0;

                if (monthlyCredits > 0 && transaction.workspace_id) {
                    const { data: workspace } = await supabase
                        .from('workspaces')
                        .select('credit_count')
                        .eq('id', transaction.workspace_id)
                        .single();

                    const currentCredits = workspace?.credit_count ?? 0;

                    await supabase
                        .from('workspaces')
                        .update({
                            credit_count: currentCredits + monthlyCredits,
                        })
                        .eq('id', transaction.workspace_id);
                }
            } else if (transaction.type === 'credit_purchase') {
                // Add credits to workspace
                const credits = transaction.credits_purchased ?? 0;

                if (credits > 0 && transaction.workspace_id) {
                    const { data: workspace } = await supabase
                        .from('workspaces')
                        .select('credit_count')
                        .eq('id', transaction.workspace_id)
                        .single();

                    const currentCredits = workspace?.credit_count ?? 0;

                    await supabase
                        .from('workspaces')
                        .update({
                            credit_count: currentCredits + credits,
                        })
                        .eq('id', transaction.workspace_id);
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Tripay webhook error:', error);
        return NextResponse.json(
            { error: error.message || 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
