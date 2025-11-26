import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getPaymentGateway, getUserPreferredGateway } from '@/lib/payment/gateway-factory';
import { z } from 'zod';

const SubscribeSchema = z.object({
    planId: z.string().uuid(),
    gatewayId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
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
            .select('current_workspace_id')
            .eq('id', user.id)
            .single();

        if (!profile?.current_workspace_id) {
            return NextResponse.json({ error: 'No workspace selected' }, { status: 400 });
        }

        const json = await request.json().catch(() => null);
        const parsed = SubscribeSchema.safeParse(json);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request payload', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const { planId, gatewayId } = parsed.data;

        // Get plan details
        const { data: plan } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('id', planId)
            .single();

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        // Free plan doesn't need payment
        if (plan.price === 0) {
            // Create free subscription
            const { data: subscription, error: subError } = await supabase
                .from('subscriptions')
                .insert({
                    workspace_id: profile.current_workspace_id,
                    plan_id: planId,
                    status: 'active',
                    current_period_start: new Date().toISOString(),
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                })
                .select()
                .single();

            if (subError) {
                return NextResponse.json({ error: subError.message }, { status: 500 });
            }

            return NextResponse.json({ subscription, requiresPayment: false });
        }

        // Determine payment gateway
        const selectedGatewayId = gatewayId || await getUserPreferredGateway(user.id);

        if (!selectedGatewayId) {
            return NextResponse.json({ error: 'No payment gateway available' }, { status: 400 });
        }

        // Get payment gateway
        const { type, client, gateway } = await getPaymentGateway(selectedGatewayId);

        // Create pending subscription
        const { data: subscription, error: subError } = await supabase
            .from('subscriptions')
            .insert({
                workspace_id: profile.current_workspace_id,
                plan_id: planId,
                payment_gateway_id: selectedGatewayId,
                status: 'pending',
            })
            .select()
            .single();

        if (subError) {
            return NextResponse.json({ error: subError.message }, { status: 500 });
        }

        // Create payment transaction
        const merchantRef = `SUB-${subscription.id}-${Date.now()}`;

        let paymentResult;

        if (type === 'tripay') {
            paymentResult = await client.createTransaction({
                method: 'BRIVA', // Default, user can choose later
                merchantRef,
                amount: plan.price,
                customerName: user.email?.split('@')[0] || 'User',
                customerEmail: user.email || '',
                orderItems: [
                    {
                        name: `${plan.display_name} Subscription`,
                        price: plan.price,
                        quantity: 1,
                    },
                ],
                returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
                expiredTime: 24 * 60 * 60, // 24 hours
            });
        } else {
            // Midtrans
            paymentResult = await client.createTransaction({
                orderId: merchantRef,
                grossAmount: plan.price,
                customerName: user.email?.split('@')[0] || 'User',
                customerEmail: user.email || '',
                itemDetails: [
                    {
                        id: planId,
                        price: plan.price,
                        quantity: 1,
                        name: `${plan.display_name} Subscription`,
                    },
                ],
            });
        }

        // Save transaction
        const { data: transaction } = await supabase
            .from('payment_transactions')
            .insert({
                workspace_id: profile.current_workspace_id,
                user_id: user.id,
                payment_gateway_id: selectedGatewayId,
                external_transaction_id: merchantRef,
                type: 'subscription',
                amount: plan.price,
                status: 'pending',
                subscription_id: subscription.id,
                payment_url: type === 'tripay' ? paymentResult.data?.checkout_url : paymentResult.redirect_url,
                payment_instructions: type === 'tripay' ? paymentResult.data?.instructions : null,
                expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            })
            .select()
            .single();

        return NextResponse.json({
            subscription,
            transaction,
            paymentUrl: type === 'tripay' ? paymentResult.data?.checkout_url : paymentResult.redirect_url,
            snapToken: type === 'midtrans' ? paymentResult.token : null,
            requiresPayment: true,
        });
    } catch (error: any) {
        console.error('Error creating subscription:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create subscription' },
            { status: 500 }
        );
    }
}
