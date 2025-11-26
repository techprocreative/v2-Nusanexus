-- Compatibility view: map public.users to public.profiles
-- This allows existing RLS policies that reference public.users
-- to work while the application uses public.profiles directly.

CREATE OR REPLACE VIEW public.users AS
SELECT
  id,
  role,
  status,
  first_name,
  last_name,
  language,
  current_workspace_id,
  created_at,
  updated_at
FROM public.profiles;