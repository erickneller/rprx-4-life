

# Fix Four Security Warnings

## Overview
A single migration addresses all four findings. One item (leaked password protection) requires a manual toggle in the Supabase dashboard.

## Migration (one file, four changes)

### 1. Add DELETE policy on `profiles`
Allow users to delete their own profile row (`auth.uid() = id`).

### 2. Restrict `onboarding_content` SELECT to authenticated
Drop the current public SELECT policy and recreate it scoped to the `authenticated` role.

### 3. Fix mutable search_path on two functions
`CREATE OR REPLACE` for `update_updated_at_column()` and `set_companies_updated_at()` adding `SET search_path = public`.

### 4. Leaked Password Protection (manual)
This is a Supabase Auth setting, not controllable via migrations. You'll need to enable it in the Supabase dashboard under **Authentication > Settings > Password Protection**.

## SQL

```sql
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
```

## Impact
- No code changes needed; all client queries remain the same.
- The `onboarding_content` table is only read by authenticated users in the app, so restricting the role has no effect on functionality.
- The leaked password protection toggle must be done manually in the Supabase dashboard.

