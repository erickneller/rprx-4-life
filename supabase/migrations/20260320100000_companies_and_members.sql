-- Migration: companies + company_members tables
-- Purpose: First-class corporate account entities for RPRX
-- Date: 2026-03-20

-- ============================================================
-- TABLE: companies
-- ============================================================
CREATE TABLE public.companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  owner_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ghl_location_id TEXT,
  plan          TEXT NOT NULL DEFAULT 'free',
  invite_token  UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- TABLE: company_members
-- ============================================================
CREATE TABLE public.company_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (company_id, user_id)
);

-- ============================================================
-- Add company fields to profiles
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN company_id   UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN company_role TEXT CHECK (company_role IN ('owner', 'admin', 'member'));

-- ============================================================
-- Enable RLS
-- ============================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Updated_at trigger for companies
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_companies_updated_at();

-- ============================================================
-- RLS POLICIES: companies
-- ============================================================

-- Members can read their own company
CREATE POLICY "Members can view their company"
  ON public.companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
    )
    OR owner_id = auth.uid()
  );

-- Company owners and admins can update their company
CREATE POLICY "Admins can update their company"
  ON public.companies FOR UPDATE
  USING (
    id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
    OR owner_id = auth.uid()
  );

-- Only authenticated users can insert companies (owner creates their own)
CREATE POLICY "Authenticated users can create companies"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- RLS POLICIES: company_members
-- ============================================================

-- Members can view memberships in their own company
CREATE POLICY "Members can view company memberships"
  ON public.company_members FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.company_members
      WHERE user_id = auth.uid()
    )
  );

-- Any authenticated user can insert their own membership (via join token flow)
CREATE POLICY "Users can join a company"
  ON public.company_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Members can delete their own membership (leave company)
CREATE POLICY "Users can leave a company"
  ON public.company_members FOR DELETE
  USING (user_id = auth.uid());
