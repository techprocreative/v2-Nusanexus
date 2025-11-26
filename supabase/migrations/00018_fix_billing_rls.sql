-- Fix missing closing parentheses in credit_packages admin policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'credit_packages'
      AND policyname = 'Admins can manage credit packages'
  ) THEN
    DROP POLICY "Admins can manage credit packages" ON public.credit_packages;
  END IF;

  CREATE POLICY "Admins can manage credit packages"
    ON public.credit_packages
    FOR ALL
    USING (
      EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
END;
$$;