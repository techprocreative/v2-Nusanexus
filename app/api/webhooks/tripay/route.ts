import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getPaymentGateway } from '@/lib/payment/gateway-factory';

export async function POST(request: Request) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-callback-signature');

        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        const data = JSON.parse(body);
        const supabase = createClient();

        // Get transaction
        const { data: transaction } = await supabase
            .from('payment_transactions')
            .select('*, payment_gateways(*)')
            .eq('external_transaction_id', data.merchant_ref)
            .single();

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        // Verify signature
        const { client } = await getPaymentGateway(transaction.payment_gateway_id);
        const isValid = client.verifyCallback(signature, data);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Update transaction status
        const newStatus = data.status === 'PAID' ? 'paid' :
            data.status === 'EXPIRED' ? 'expired' :
                data.status === 'FAILED' ? 'failed' : 'pending';

        await supabase
            .from('payment_transactions')
            .update({
                status: newStatus,
                paid_at: data.status === 'PAID' ? new Date().toISOString() : null,
                payment_method: data.payment_method,
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
                        external_subscription_id: data.reference,
                    })
                    .eq('id', transaction.subscription_id);

                // Allocate monthly credits
                const { data: subscription } = await supabase
                    .from('subscriptions')
                    .select('*, subscription_plans(monthly_credits)')
                    .eq('id', transaction.subscription_id)
                    .single();

                if (subscription) {
                    const monthlyCredits = (subscription as any).subscription_plans?.monthly_credits ?? 0;

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
                }
            } else if (transaction.type === 'credit_purchase') {
                // Add credits to workspace
                const creditsToAdd = transaction.credits_purchased ?? 0;

                if (creditsToAdd > 0 && transaction.workspace_id) {
                    const { data: workspace } = await supabase
                        .from('workspaces')
                        .select('credit_count')
                        .eq('id', transaction.workspace_id)
                        .single();

                    const currentCredits = workspace?.credit_count ?? 0;

                    await supabase
                        .from('workspaces')
                        .update({
                            credit_count: currentCredits + creditsToAdd,
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
