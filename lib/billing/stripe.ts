import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function createCheckoutSession(
  workspaceId: string,
  planId: string,
  userId: string
) {
  const supabase = createClient();

  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (!plan) {
    throw new Error('Plan not found');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  const session = await stripe.checkout.sessions.create({
    mode: plan.billing_cycle === 'one-time' ? 'payment' : 'subscription',
    payment_method_types: ['card'],
    customer_email: profile?.first_name ? undefined : undefined,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: plan.title,
            description: plan.description ?? undefined,
          },
          unit_amount: plan.price,
          ...(plan.billing_cycle !== 'one-time' && {
            recurring: {
              interval: plan.billing_cycle === 'yearly' ? 'year' : 'month',
            },
          }),
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    metadata: {
      workspace_id: workspaceId,
      plan_id: planId,
      user_id: userId,
    },
  });

  return session;
}

export async function createPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  return session;
}

export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return subscription;
}

export async function resumeSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  return subscription;
}
