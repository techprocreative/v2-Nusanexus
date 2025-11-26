import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getPaymentGateway } from '@/lib/payment/gateway-factory';

export async function POST(request: Request) {
    try {
        const notification = await request.json();
        const supabase = createServiceClient();

        // Get transaction (service role bypasses RLS)
        const { data: transaction, error: txError } = await supabase
            .from('payment_transactions')
            .select('*, payment_gateways(*)')
            .eq('external_transaction_id', notification.order_id)
            .single();

        if (txError || !transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        // Verify notification using configured gateway
        const { client } = await getPaymentGateway(transaction.payment_gateway_id);
        const isValid = client.verifyNotification(notification);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid notification' }, { status: 400 });
        }

        // Map Midtrans status to internal status
        const { transaction_status, fraud_status } = notification;
        let newStatus: string = 'pending';

        if (transaction_status === 'capture') {
            newStatus = fraud_status === 'accept' ? 'paid' : 'failed';
        } else if (transaction_status === 'settlement') {
            newStatus = 'paid';
        } else if (
            transaction_status === 'deny' ||
            transaction_status === 'cancel' ||
            transaction_status === 'expire'
        ) {
            newStatus = 'failed';
        }

        // Update transaction
        await supabase
            .from('payment_transactions')
            .update({
                status: newStatus,
                paid_at: newStatus === 'paid' ? new Date().toISOString() : transaction.paid_at,
                payment_method: notification.payment_type,
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
                        external_subscription_id: notification.transaction_id,
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
        console.error('Midtrans webhook error:', error);
        return NextResponse.json(
            { error: error.message || 'Webhook processing failed' },
            { status: 500 }
        );
    }
}
