-- Align existing subscriptions table with new billing schema (Tripay/Midtrans)
-- This migration assumes 00004_create_subscriptions.sql and 00016_create_billing_tables.sql have run.

-- Add Tripay/Midtrans-related columns if they don't exist yet
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS payment_gateway_id UUID REFERENCES public.payment_gateways(id),
  ADD COLUMN IF NOT EXISTS external_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Re-point plan_id foreign key to subscription_plans instead of plans
DO $$
BEGIN
  -- Drop old FK if it exists
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'subscriptions_plan_id_fkey'
      AND conrelid = 'public.subscriptions'::regclass
  ) THEN
    ALTER TABLE public.subscriptions
      DROP CONSTRAINT subscriptions_plan_id_fkey;
  END IF;

  -- Add new FK to subscription_plans
  ALTER TABLE public.subscriptions
    ADD CONSTRAINT subscriptions_plan_id_fkey
    FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id) ON DELETE SET NULL;
END;
$$;