-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  plan_snapshot_id UUID REFERENCES public.plan_snapshots(id) ON DELETE SET NULL,
  payment_gateway TEXT, -- 'stripe', 'paypal', etc.
  external_id TEXT, -- Stripe subscription ID
  customer_external_id TEXT, -- Stripe customer ID
  price_external_id TEXT, -- Stripe price ID
  product_external_id TEXT, -- Stripe product ID
  currency_code VARCHAR(3) DEFAULT 'USD',
  trial_period_days INTEGER,
  usage_count NUMERIC(23, 11) DEFAULT 0, -- credit usage
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ,
  renew_at TIMESTAMPTZ,
  reset_credits_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  UNIQUE(payment_gateway, external_id)
);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  plan_snapshot_id UUID REFERENCES public.plan_snapshots(id) ON DELETE SET NULL NOT NULL,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  currency_code VARCHAR(3) DEFAULT 'USD',
  is_paid BOOLEAN DEFAULT false,
  is_fulfilled BOOLEAN DEFAULT false,
  trial_period_days INTEGER,
  payment_gateway TEXT,
  external_id TEXT, -- Stripe checkout session or payment intent ID
  total_amount INTEGER NOT NULL, -- in cents
  discount_amount INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_workspace ON public.subscriptions(workspace_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_external ON public.subscriptions(payment_gateway, external_id);
CREATE INDEX idx_orders_workspace ON public.orders(workspace_id);
CREATE INDEX idx_orders_paid ON public.orders(is_paid);

-- Add subscription FK to workspaces
ALTER TABLE public.workspaces 
  ADD CONSTRAINT fk_workspace_subscription 
  FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Subscriptions
CREATE POLICY "Workspace members can view subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for Orders
CREATE POLICY "Workspace members can view orders"
  ON public.orders FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Workspace members can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage orders"
  ON public.orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Triggers
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
