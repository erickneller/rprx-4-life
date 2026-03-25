-- 1. profiles DELETE policy
CREATE POLICY "Users can delete their own profile"
ON public.profiles FOR DELETE TO public
USING (auth.uid() = id);

-- 2. onboarding_content: restrict SELECT to authenticated
DROP POLICY "Authenticated users can read onboarding content" ON public.onboarding_content;
CREATE POLICY "Authenticated users can read onboarding content"
ON public.onboarding_content FOR SELECT TO authenticated
USING (true);

-- 3a. Fix search_path on update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3b. Fix search_path on set_companies_updated_at
CREATE OR REPLACE FUNCTION public.set_companies_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;