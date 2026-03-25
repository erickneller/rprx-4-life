
CREATE TABLE public.user_dashboard_card_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  card_id text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, card_id)
);

ALTER TABLE public.user_dashboard_card_order ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own card order"
  ON public.user_dashboard_card_order FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own card order"
  ON public.user_dashboard_card_order FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own card order"
  ON public.user_dashboard_card_order FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own card order"
  ON public.user_dashboard_card_order FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
