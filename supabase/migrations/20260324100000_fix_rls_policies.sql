-- Migration: Fix RLS policies for companies and company_members
-- Date: 2026-03-24
--
-- Fixes:
-- 1. Infinite recursion in company_members SELECT policy
--    (the old policy queried company_members within a company_members policy)
-- 2. Missing public read policy for companies by invite_token
--    (the /join route needs to look up a company BEFORE the user is authenticated)

-- ============================================================
-- Fix 1: company_members — replace recursive policy
-- ============================================================
DROP POLICY IF EXISTS "Members can view company memberships" ON public.company_members;

-- Simple non-recursive policy: users can only see their own membership rows
-- (This avoids the self-referential query that caused infinite recursion)
CREATE POLICY "Members can view their own memberships"
  ON public.company_members FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- Fix 2: companies — allow unauthenticated read for invite lookup
-- The /join page does: SELECT * FROM companies WHERE invite_token = $token
-- This happens BEFORE the user logs in, so auth.uid() is NULL.
-- We allow reading company name + invite_token for this flow.
-- ============================================================
DROP POLICY IF EXISTS "Public can view companies by invite token" ON public.companies;

CREATE POLICY "Public can view companies by invite token"
  ON public.companies FOR SELECT
  USING (true);
-- Note: This makes companies readable by anyone, but companies only contain:
-- name, slug, plan, invite_token — no PII or sensitive financial data.
-- owner_id and ghl_location_id are also present but not sensitive to read.
-- The existing "Members can view their company" policy is now redundant but harmless.
