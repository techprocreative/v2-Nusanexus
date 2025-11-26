-- Plans
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  feature_list TEXT[], -- Array of feature strings
  price INTEGER NOT NULL, -- in cents
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime', 'one-time')),
  credit_count NUMERIC(23, 11),
  config JSONB DEFAULT '{}',
  status SMALLINT DEFAULT 1, -- 0: inactive, 1: active
  is_featured BOOLEAN DEFAULT false,
  superiority SMALLINT DEFAULT 0, -- for ordering plans
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plan Snapshots (historical versions for orders)
CREATE TABLE public.plan_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  feature_list TEXT[],
  price INTEGER NOT NULL,
  billing_cycle TEXT,
  credit_count NUMERIC(23, 11),
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Coupons
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  amount INTEGER NOT NULL, -- percentage (0-100) or fixed amount in cents
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly', 'lifetime', 'one-time')),
  cycle_count INTEGER, -- number of billing cycles coupon applies
  max_redemption_count INTEGER,
  current_redemption_count INTEGER DEFAULT 0,
  status SMALLINT DEFAULT 1,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_plans_status ON public.plans(status);
CREATE INDEX idx_plans_billing_cycle ON public.plans(billing_cycle);
CREATE INDEX idx_plan_snapshots_plan ON public.plan_snapshots(plan_id);
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_status ON public.coupons(status);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Public can view active plans
CREATE POLICY "Anyone can view active plans"
  ON public.plans FOR SELECT
  USING (status = 1);

CREATE POLICY "Admins can manage plans"
  ON public.plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can view plan snapshots"
  ON public.plan_snapshots FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage plan snapshots"
  ON public.plan_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can view active coupons"
  ON public.coupons FOR SELECT
  USING (status = 1 AND deleted_at IS NULL);

CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Triggers
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
