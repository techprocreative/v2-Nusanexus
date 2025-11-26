-- Affiliates
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  code VARCHAR(255) UNIQUE NOT NULL,
  payout_method TEXT CHECK (payout_method IN ('paypal', 'bank_transfer')),
  paypal_email VARCHAR(255),
  bank_requisites TEXT,
  click_count INTEGER DEFAULT 0,
  referral_count INTEGER DEFAULT 0,
  balance_amount INTEGER DEFAULT 0, -- in cents
  pending_amount INTEGER DEFAULT 0,
  withdrawn_amount INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payouts
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL, -- in cents
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stats (Analytics)
CREATE TABLE public.stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'usage', 'signup', 'order', 'subscription'
  date DATE NOT NULL,
  metric NUMERIC(23, 11),
  country_code VARCHAR(2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- System Options (key-value store)
CREATE TABLE public.options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_affiliates_user ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_code ON public.affiliates(code);
CREATE INDEX idx_payouts_affiliate ON public.payouts(affiliate_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);
CREATE INDEX idx_stats_workspace ON public.stats(workspace_id);
CREATE INDEX idx_stats_date ON public.stats(date);
CREATE INDEX idx_stats_type ON public.stats(type);
CREATE INDEX idx_options_key ON public.options(key);

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Affiliates
CREATE POLICY "Users can view own affiliate"
  ON public.affiliates FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own affiliate"
  ON public.affiliates FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own affiliate"
  ON public.affiliates FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage affiliates"
  ON public.affiliates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for Payouts
CREATE POLICY "Affiliates can view own payouts"
  ON public.payouts FOR SELECT
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Affiliates can create payout requests"
  ON public.payouts FOR INSERT
  WITH CHECK (
    affiliate_id IN (
      SELECT id FROM public.affiliates WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage payouts"
  ON public.payouts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for Stats
CREATE POLICY "Workspace members can view stats"
  ON public.stats FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage stats"
  ON public.stats FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for Options
CREATE POLICY "Authenticated users can view options"
  ON public.options FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage options"
  ON public.options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Triggers
CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at
  BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_options_updated_at
  BEFORE UPDATE ON public.options
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
