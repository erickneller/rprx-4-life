CREATE TABLE public.user_health_assessments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  persona text,
  primary_horseman text,
  secondary_horseman text,
  recommended_track text,
  recommended_track_name text,
  readiness_score integer,
  readiness_label text,
  horseman_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  quick_wins jsonb NOT NULL DEFAULT '[]'::jsonb,
  weekly_focus jsonb NOT NULL DEFAULT '[]'::jsonb,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  basic_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  health_habits jsonb NOT NULL DEFAULT '{}'::jsonb,
  screenings jsonb NOT NULL DEFAULT '{}'::jsonb,
  goals jsonb NOT NULL DEFAULT '{}'::jsonb,
  contact jsonb NOT NULL DEFAULT '{}'::jsonb,
  bmi numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_health_assessments_user ON public.user_health_assessments(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_health_assessments TO authenticated;
GRANT ALL ON public.user_health_assessments TO service_role;

ALTER TABLE public.user_health_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own health assessments"
  ON public.user_health_assessments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own health assessments"
  ON public.user_health_assessments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own health assessments"
  ON public.user_health_assessments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own health assessments"
  ON public.user_health_assessments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_health_assessments_updated_at
  BEFORE UPDATE ON public.user_health_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();