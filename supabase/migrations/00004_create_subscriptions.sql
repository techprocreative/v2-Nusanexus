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
  external_id TEXT, -- Checkout session or payment intent ID
  total_amount INTEGER NOT NULL, -- in cents
  discount_amount INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_workspace ON public.orders(workspace_id);
CREATE INDEX idx_orders_paid ON public.orders(is_paid);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

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
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
