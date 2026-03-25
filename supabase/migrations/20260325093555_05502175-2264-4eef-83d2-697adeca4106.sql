
-- 1. RLS policy: company owners/admins can see all members of their company
CREATE POLICY "Company admins can view company members"
ON public.company_members
FOR SELECT
TO public
USING (
  company_id IN (
    SELECT cm.company_id FROM public.company_members cm
    WHERE cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
  )
);

-- 2. RPC function: returns non-sensitive member stats for a company
CREATE OR REPLACE FUNCTION public.company_dashboard_stats(_company_id uuid)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  joined_at timestamptz,
  last_active_date date,
  current_streak integer,
  current_tier text,
  onboarding_completed boolean,
  has_assessment boolean,
  total_points_earned integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Validate caller is owner/admin of this company
  SELECT
    cm.user_id,
    p.full_name,
    cm.joined_at,
    p.last_active_date,
    p.current_streak,
    p.current_tier,
    p.onboarding_completed,
    EXISTS(SELECT 1 FROM user_assessments ua WHERE ua.user_id = cm.user_id AND ua.completed_at IS NOT NULL) AS has_assessment,
    p.total_points_earned
  FROM company_members cm
  JOIN profiles p ON p.id = cm.user_id
  WHERE cm.company_id = _company_id
    AND EXISTS (
      SELECT 1 FROM company_members caller
      WHERE caller.company_id = _company_id
        AND caller.user_id = auth.uid()
        AND caller.role IN ('owner', 'admin')
    )
  ORDER BY cm.joined_at DESC;
$$;
