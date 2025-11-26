-- Phase 4: Billing & Subscriptions Database Schema
-- Payment Gateways (Tripay & Midtrans)

-- Payment gateway configurations (admin-managed)
CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- 'tripay', 'midtrans'
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_sandbox BOOLEAN DEFAULT false,
  
  -- Encrypted credentials (JSON)
  credentials_encrypted TEXT NOT NULL,
  
  -- Gateway-specific settings
  settings JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- 'free', 'starter', 'pro', 'enterprise'
  display_name TEXT NOT NULL,
  monthly_credits INTEGER NOT NULL,
  price INTEGER NOT NULL, -- in IDR (Rupiah)
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id),
  
  -- Payment gateway info
  payment_gateway_id UUID REFERENCES public.payment_gateways(id),
  external_subscription_id TEXT, -- ID from payment gateway
  
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'expired', 'pending'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link workspaces.subscription_id to the new subscriptions table (safe if constraint already exists)
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_workspace_subscription'
      AND conrelid = 'public.workspaces'::regclass
  ) THEN
    ALTER TABLE public.workspaces 
      ADD CONSTRAINT fk_workspace_subscription 
      FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;
  END IF;
END;
$;

-- Credit packages (for one-time purchases)
CREATE TABLE IF NOT EXISTS public.credit_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price INTEGER NOT NULL, -- in IDR
  discount_percentage INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  
  -- Payment gateway info
  payment_gateway_id UUID REFERENCES public.payment_gateways(id),
  external_transaction_id TEXT, -- Reference from gateway
  payment_method TEXT, -- 'bank_transfer', 'e_wallet', 'qris', etc.
  
  -- Transaction details
  type TEXT NOT NULL, -- 'subscription', 'credit_purchase'
  amount INTEGER NOT NULL, -- in IDR
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'expired'
  
  -- Related records
  subscription_id UUID REFERENCES public.subscriptions(id),
  credit_package_id UUID REFERENCES public.credit_packages(id),
  credits_purchased INTEGER DEFAULT 0,
  
  -- Payment details
  payment_url TEXT, -- Checkout URL
  payment_instructions JSONB, -- Bank account, VA number, etc.
  paid_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User payment preferences
CREATE TABLE IF NOT EXISTS public.user_payment_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  preferred_gateway_id UUID REFERENCES public.payment_gateways(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_workspace ON public.subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON public.subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_workspace ON public.payment_transactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON public.payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_external ON public.payment_transactions(external_transaction_id);

-- Enable Row Level Security
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_payment_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Payment Gateways: Only admins can view/manage
CREATE POLICY "Admins can view payment gateways"
  ON public.payment_gateways FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage payment gateways"
  ON public.payment_gateways FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Subscription Plans: Anyone can view active plans
CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

-- Admins can manage plans
CREATE POLICY "Admins can manage plans"
  ON public.subscription_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Subscriptions: Users can view their workspace subscription
CREATE POLICY "Users can view workspace subscription"
  ON public.subscriptions FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- Credit Packages: Anyone can view active packages
CREATE POLICY "Anyone can view credit packages"
  ON public.credit_packages FOR SELECT
  USING (is_active = true);

-- Admins can manage credit packages
CREATE POLICY "Admins can manage credit packages"
  ON public.credit_packages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Payment Transactions: Users can view their own transactions
CREATE POLICY "Users can view their transactions"
  ON public.payment_transactions FOR SELECT
  USING (user_id = auth.uid());

-- Users can create transactions
CREATE POLICY "Users can create transactions"
  ON public.payment_transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- User Payment Preferences: Users can manage their own preferences
CREATE POLICY "Users can view their preferences"
  ON public.user_payment_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their preferences"
  ON public.user_payment_preferences FOR ALL
  USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_payment_gateways_updated_at
  BEFORE UPDATE ON public.payment_gateways
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_packages_updated_at
  BEFORE UPDATE ON public.credit_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_payment_preferences_updated_at
  BEFORE UPDATE ON public.user_payment_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, display_name, monthly_credits, price, features, sort_order) VALUES
  ('free', 'Free', 100, 0, '["GPT-3.5 Turbo, Claude Instant, Llama 3", "100 text generations (~100K tokens)", "10 images (standard quality)", "Community support", "Watermark on images"]', 1),
  ('starter', 'Starter', 1500, 149000, '["All AI models access", "1,500 credits/month", "~300K tokens with GPT-4 Turbo", "150 images (DALL-E 3)", "Email support", "No watermark"]', 2),
  ('pro', 'Pro', 5000, 399000, '["All AI models access", "5,000 credits/month", "~1M tokens with GPT-4 Turbo", "500 images", "Priority support", "API access", "Team collaboration"]', 3),
  ('enterprise', 'Enterprise', 25000, 1499000, '["All AI models access", "25,000 credits/month", "~5M tokens with GPT-4 Turbo", "2,500 images", "24/7 priority support", "Custom integrations", "Dedicated account manager", "White-label option"]', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert default credit packages
INSERT INTO public.credit_packages (name, credits, price, discount_percentage, sort_order) VALUES
  ('Small Pack', 500, 59000, 0, 1),
  ('Medium Pack', 1000, 109000, 7, 2),
  ('Large Pack', 2500, 249000, 16, 3),
  ('Mega Pack', 5000, 449000, 24, 4)
ON CONFLICT DO NOTHING;

-- Create default free subscription for existing workspaces
INSERT INTO public.subscriptions (workspace_id, plan_id, status, current_period_start, current_period_end)
SELECT 
  w.id,
  (SELECT id FROM public.subscription_plans WHERE name = 'free'),
  'active',
  NOW(),
  NOW() + INTERVAL '1 year'
FROM public.workspaces w
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.workspace_id = w.id
);
