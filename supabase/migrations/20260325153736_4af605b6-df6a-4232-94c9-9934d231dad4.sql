
-- Create a SECURITY DEFINER function to check company membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id
  )
$$;

-- Create a SECURITY DEFINER function to check company admin/owner role
CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id
      AND company_id = _company_id
      AND role IN ('owner', 'admin')
  )
$$;

-- Create a helper to get user's company_id without RLS
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.company_members
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- ====== Fix company_members policies ======

-- Drop the self-referencing policy causing infinite recursion
DROP POLICY IF EXISTS "Company admins can view company members" ON public.company_members;

-- Recreate it using the SECURITY DEFINER function
CREATE POLICY "Company admins can view company members"
ON public.company_members
FOR SELECT
TO public
USING (
  is_company_admin(auth.uid(), company_id)
);

-- ====== Fix companies policies ======

-- Drop policies that subquery company_members (causing recursion)
DROP POLICY IF EXISTS "Members can view their company" ON public.companies;
DROP POLICY IF EXISTS "Admins can update their company" ON public.companies;

-- Recreate "Members can view their company" using SECURITY DEFINER function
CREATE POLICY "Members can view their company"
ON public.companies
FOR SELECT
TO public
USING (
  is_company_member(auth.uid(), id)
  OR owner_id = auth.uid()
);

-- Recreate "Admins can update their company" using SECURITY DEFINER function
CREATE POLICY "Admins can update their company"
ON public.companies
FOR UPDATE
TO public
USING (
  is_company_admin(auth.uid(), id)
  OR owner_id = auth.uid()
);
