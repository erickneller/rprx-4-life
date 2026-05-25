ALTER TABLE public.user_subscriptions
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_subscription_id,
  DROP COLUMN IF EXISTS stripe_price_id,
  ADD COLUMN IF NOT EXISTS affiliate_id text;

ALTER TABLE public.user_subscriptions
  ALTER COLUMN source SET DEFAULT 'ghl';

CREATE TABLE IF NOT EXISTS public.affiliate_attributions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_id text NOT NULL,
  landing_path text,
  captured_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own attribution"
  ON public.affiliate_attributions
  FOR SELECT
  USING (auth.uid() = user_id);