-- API Rate Limiting Table
-- Stores per-user, per-endpoint usage counters in fixed time windows.

CREATE TABLE public.api_rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  endpoint TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure each user/endpoint/window combination is unique for upserts
CREATE UNIQUE INDEX idx_api_rate_limits_unique
  ON public.api_rate_limits(user_id, endpoint, window_start);

-- No RLS for this internal table (used server-side only)