import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServiceClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { workspace_id, plan_id } = session.metadata ?? {};

        if (!workspace_id || !plan_id) {
          throw new Error('Missing metadata');
        }

        // Get plan details
        const { data: plan } = await supabase
          .from('plans')
          .select('*')
          .eq('id', plan_id)
          .single();

        if (!plan) {
          throw new Error('Plan not found');
        }

        // Create plan snapshot
        const { data: snapshot } = await supabase
          .from('plan_snapshots')
          .insert({
            plan_id: plan.id,
            title: plan.title,
            description: plan.description,
            icon: plan.icon,
            feature_list: plan.feature_list,
            price: plan.price,
            billing_cycle: plan.billing_cycle,
            credit_count: plan.credit_count,
            config: plan.config,
          })
          .select()
          .single();

        // Create subscription
        const { data: subscription } = await supabase
          .from('subscriptions')
          .insert({
            workspace_id,
            plan_id: plan.id,
            plan_snapshot_id: snapshot?.id,
            payment_gateway: 'stripe',
            external_id: session.subscription as string,
            customer_external_id: session.customer as string,
            status: 'active',
          })
          .select()
          .single();

        // Update workspace
        await supabase
          .from('workspaces')
          .update({
            subscription_id: subscription?.id,
            credit_count: plan.credit_count,
          })
          .eq('id', workspace_id);

        // Create order
        await supabase.from('orders').insert({
          workspace_id,
          plan_snapshot_id: snapshot?.id,
          payment_gateway: 'stripe',
          external_id: session.payment_intent as string,
          total_amount: session.amount_total ?? plan.price,
          is_paid: true,
          is_fulfilled: true,
        });

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status === 'active' ? 'active' : 
                   subscription.status === 'canceled' ? 'canceled' :
                   subscription.status === 'past_due' ? 'past_due' :
                   subscription.status === 'trialing' ? 'trialing' : 'active',
            renew_at: new Date(subscription.current_period_end * 1000).toISOString(),
            canceled_at: subscription.canceled_at 
              ? new Date(subscription.canceled_at * 1000).toISOString() 
              : null,
          })
          .eq('external_id', subscription.id)
          .eq('payment_gateway', 'stripe');

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        const { data: sub } = await supabase
          .from('subscriptions')
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
          })
          .eq('external_id', subscription.id)
          .eq('payment_gateway', 'stripe')
          .select()
          .single();

        // Remove subscription from workspace
        if (sub?.workspace_id) {
          await supabase
            .from('workspaces')
            .update({ subscription_id: null })
            .eq('id', sub.workspace_id);
        }

        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.billing_reason === 'subscription_cycle') {
          // Recurring payment - reset credits
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('workspace_id, plans(credit_count)')
            .eq('external_id', invoice.subscription as string)
            .eq('payment_gateway', 'stripe')
            .single();

          if (sub?.workspace_id) {
            await supabase
              .from('workspaces')
              .update({
                credit_count: (sub.plans as any)?.credit_count ?? 0,
              })
              .eq('id', sub.workspace_id);
          }
        }

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
