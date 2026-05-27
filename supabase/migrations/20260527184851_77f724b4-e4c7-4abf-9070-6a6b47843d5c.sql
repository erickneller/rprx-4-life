DROP FUNCTION IF EXISTS public.company_dashboard_stats(uuid);

CREATE OR REPLACE FUNCTION public.company_dashboard_stats(_company_id uuid)
 RETURNS TABLE(user_id uuid, full_name text, joined_at timestamp with time zone, last_active_date date, current_streak integer, current_tier text, subscription_tier text, onboarding_completed boolean, has_assessment boolean, total_points_earned integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    cm.user_id,
    p.full_name,
    cm.joined_at,
    p.last_active_date,
    p.current_streak,
    p.current_tier,
    public.get_subscription_tier(cm.user_id) AS subscription_tier,
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
$function$;