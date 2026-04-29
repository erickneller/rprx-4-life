ALTER TABLE public.plan_generation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own plan_generation_events" ON public.plan_generation_events;
CREATE POLICY "Users can insert their own plan_generation_events"
  ON public.plan_generation_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own plan_generation_events" ON public.plan_generation_events;
CREATE POLICY "Users can view their own plan_generation_events"
  ON public.plan_generation_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all plan_generation_events" ON public.plan_generation_events;
CREATE POLICY "Admins can view all plan_generation_events"
  ON public.plan_generation_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS idx_plan_generation_events_created_at ON public.plan_generation_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_plan_generation_events_user_id ON public.plan_generation_events (user_id);
CREATE INDEX IF NOT EXISTS idx_plan_generation_events_chosen_strategy ON public.plan_generation_events (chosen_strategy_id);

ALTER TABLE public.plan_generation_events
  ADD COLUMN IF NOT EXISTS model_variant text;