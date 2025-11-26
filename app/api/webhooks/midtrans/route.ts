import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getPaymentGateway } from '@/lib/payment/gateway-factory';

export async function POST(request: Request) {
    try {
        const notification = await request.json();
        const supabase = createClient();

        // Get transaction
        const { data: transaction } = await supabase
            .from('payment_transactions')
            .select('*, payment_gateways(*)')
            .eq('external_transaction_id', notification.order_id)
            .single();

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        // Verify notification
        const { client } = await getPaymentGateway(transaction.payment_gateway_id);
        const isValid = client.verifyNotification(notification);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid notification' }, { status: 400 });
        }

        // Map Midtrans status to our status
        const { transaction_status, fraud_status } = notification;
        let newStatus = 'pending';

        if (transaction_status === 'capture') {
            newStatus = fraud_status === 'accept' ? 'paid' : 'failed';
        } else if (transaction_status === 'settlement') {
            newStatus = 'paid';
        } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
            newStatus = 'failed';
        }

        // Update transaction
        await supabase
            .from('payment_transactions')
            .update({
                status: newStatus,
                paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
                payment_method: notification.payment_type,
            })
            .eq('id', transaction.id);

        // If paid, process the transaction
        if (newStatus === 'paid') {
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

                if (subscription) {
                    await supabase
                        .from('workspaces')
                        .update({
                            credit_count: supabase.raw(`credit_count + ${subscription.subscription_plans.monthly_credits}`),
                        })
                        .eq('id', transaction.workspace_id);
                }
            } else if (transaction.type === 'credit_purchase') {
                // Add credits to workspace
                await supabase
                    .from('workspaces')
                    .update({
                        credit_count: supabase.raw(`credit_count + ${transaction.credits_purchased}`),
                    })
                    .eq('id', transaction.workspace_id);
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
