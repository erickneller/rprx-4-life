
-- 1. video_open_events table
CREATE TABLE public.video_open_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL CHECK (source IN ('course_lesson','library_video')),
  source_id uuid,
  title text,
  video_url text,
  opened_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.video_open_events TO authenticated;
GRANT ALL ON public.video_open_events TO service_role;

ALTER TABLE public.video_open_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own video opens"
  ON public.video_open_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own video opens"
  ON public.video_open_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all video opens"
  ON public.video_open_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX video_open_events_user_opened_idx
  ON public.video_open_events (user_id, opened_at DESC);
CREATE INDEX video_open_events_source_idx
  ON public.video_open_events (source, source_id);

-- 2. admin_list_users_with_tier
CREATE OR REPLACE FUNCTION public.admin_list_users_with_tier()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  last_active_date date,
  current_streak integer,
  total_points_earned integer,
  onboarding_completed boolean,
  company_id uuid,
  company_name text,
  tier text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    au.id,
    au.email::text,
    p.full_name,
    au.created_at,
    au.last_sign_in_at,
    p.last_active_date,
    COALESCE(p.current_streak, 0),
    COALESCE(p.total_points_earned, 0),
    COALESCE(p.onboarding_completed, false),
    p.company_id,
    c.name,
    public.get_subscription_tier(au.id)
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  LEFT JOIN public.companies c ON c.id = p.company_id
  ORDER BY au.created_at DESC;
END;
$$;

-- 3. admin_user_activity_summary
CREATE OR REPLACE FUNCTION public.admin_user_activity_summary(_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  company_id uuid,
  company_name text,
  tier text,
  last_active_date date,
  current_streak integer,
  total_points_earned integer,
  onboarding_completed boolean,
  assessments_completed bigint,
  plans_saved bigint,
  focus_plan_title text,
  badges_earned bigint,
  course_lessons_opened bigint,
  library_videos_opened bigint,
  total_video_opens bigint,
  last_video_opened_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    au.id,
    au.email::text,
    p.full_name,
    p.company_id,
    c.name,
    public.get_subscription_tier(au.id),
    p.last_active_date,
    COALESCE(p.current_streak, 0),
    COALESCE(p.total_points_earned, 0),
    COALESCE(p.onboarding_completed, false),
    (SELECT COUNT(*) FROM public.user_assessments ua WHERE ua.user_id = _user_id AND ua.completed_at IS NOT NULL),
    (SELECT COUNT(*) FROM public.saved_plans sp WHERE sp.user_id = _user_id),
    (SELECT sp.title FROM public.saved_plans sp WHERE sp.user_id = _user_id AND sp.is_focus = true LIMIT 1),
    (SELECT COUNT(*) FROM public.user_badges ub WHERE ub.user_id = _user_id),
    (SELECT COUNT(DISTINCT v.source_id) FROM public.video_open_events v WHERE v.user_id = _user_id AND v.source = 'course_lesson'),
    (SELECT COUNT(DISTINCT v.source_id) FROM public.video_open_events v WHERE v.user_id = _user_id AND v.source = 'library_video'),
    (SELECT COUNT(*) FROM public.video_open_events v WHERE v.user_id = _user_id),
    (SELECT MAX(v.opened_at) FROM public.video_open_events v WHERE v.user_id = _user_id)
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  LEFT JOIN public.companies c ON c.id = p.company_id
  WHERE au.id = _user_id;
END;
$$;

-- 4. admin_company_activity_rollup
CREATE OR REPLACE FUNCTION public.admin_company_activity_rollup()
RETURNS TABLE (
  company_id uuid,
  company_name text,
  plan text,
  member_count bigint,
  free_count bigint,
  partner_count bigint,
  pro_count bigint,
  active_last_7d bigint,
  active_last_30d bigint,
  assessments_completed bigint,
  plans_saved bigint,
  total_video_opens bigint,
  course_opens bigint,
  library_opens bigint,
  avg_streak numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  WITH member_tiers AS (
    SELECT cm.company_id, cm.user_id, public.get_subscription_tier(cm.user_id) AS t
    FROM public.company_members cm
  )
  SELECT
    c.id,
    c.name,
    c.plan,
    (SELECT COUNT(*) FROM public.company_members cm WHERE cm.company_id = c.id),
    (SELECT COUNT(*) FROM member_tiers mt WHERE mt.company_id = c.id AND mt.t = 'free'),
    (SELECT COUNT(*) FROM member_tiers mt WHERE mt.company_id = c.id AND mt.t = 'partner'),
    (SELECT COUNT(*) FROM member_tiers mt WHERE mt.company_id = c.id AND mt.t = 'pro'),
    (SELECT COUNT(*) FROM public.company_members cm JOIN public.profiles p ON p.id = cm.user_id WHERE cm.company_id = c.id AND p.last_active_date >= (CURRENT_DATE - INTERVAL '7 days')),
    (SELECT COUNT(*) FROM public.company_members cm JOIN public.profiles p ON p.id = cm.user_id WHERE cm.company_id = c.id AND p.last_active_date >= (CURRENT_DATE - INTERVAL '30 days')),
    (SELECT COUNT(*) FROM public.user_assessments ua JOIN public.company_members cm ON cm.user_id = ua.user_id WHERE cm.company_id = c.id AND ua.completed_at IS NOT NULL),
    (SELECT COUNT(*) FROM public.saved_plans sp JOIN public.company_members cm ON cm.user_id = sp.user_id WHERE cm.company_id = c.id),
    (SELECT COUNT(*) FROM public.video_open_events v JOIN public.company_members cm ON cm.user_id = v.user_id WHERE cm.company_id = c.id),
    (SELECT COUNT(*) FROM public.video_open_events v JOIN public.company_members cm ON cm.user_id = v.user_id WHERE cm.company_id = c.id AND v.source = 'course_lesson'),
    (SELECT COUNT(*) FROM public.video_open_events v JOIN public.company_members cm ON cm.user_id = v.user_id WHERE cm.company_id = c.id AND v.source = 'library_video'),
    (SELECT COALESCE(AVG(p.current_streak), 0) FROM public.company_members cm JOIN public.profiles p ON p.id = cm.user_id WHERE cm.company_id = c.id)
  FROM public.companies c
  ORDER BY c.name;
END;
$$;
