-- Migration: Admin-level RLS policies for companies
-- Purpose: Allow service-role / admin users full access to companies tables
-- Date: 2026-03-20
--
-- Admin users (those with a row in user_roles with role='admin') get
-- unrestricted read/write on both companies tables.

-- ============================================================
-- Admin full access: companies
-- ============================================================
CREATE POLICY "Admins have full access to companies"
  ON public.companies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Admin full access: company_members
-- ============================================================
CREATE POLICY "Admins have full access to company_members"
  ON public.company_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
