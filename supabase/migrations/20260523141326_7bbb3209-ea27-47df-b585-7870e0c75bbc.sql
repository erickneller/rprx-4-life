
-- 1. Extend user_subscriptions
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS ghl_contact_id text,
  ADD COLUMN IF NOT EXISTS ghl_subscription_id text,
  ADD COLUMN IF NOT EXISTS ghl_product_id text;

CREATE UNIQUE INDEX IF NOT EXISTS user_subscriptions_ghl_sub_id_uidx
  ON public.user_subscriptions (ghl_subscription_id)
  WHERE ghl_subscription_id IS NOT NULL;

-- 2. pending_ghl_subscriptions
CREATE TABLE IF NOT EXISTS public.pending_ghl_subscriptions (
  email text PRIMARY KEY,
  tier text NOT NULL,
  billing_interval text,
  ghl_contact_id text,
  ghl_subscription_id text,
  ghl_product_id text,
  current_period_end timestamptz,
  claim_token uuid NOT NULL DEFAULT gen_random_uuid(),
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_ghl_subscriptions ENABLE ROW LEVEL SECURITY;
-- No policies: only service role (edge functions) can access.

CREATE TRIGGER pending_ghl_subscriptions_updated_at
  BEFORE UPDATE ON public.pending_ghl_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. ghl_product_tier_map
CREATE TABLE IF NOT EXISTS public.ghl_product_tier_map (
  ghl_product_id text PRIMARY KEY,
  tier text NOT NULL,
  billing_interval text NOT NULL DEFAULT 'month',
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ghl_product_tier_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ghl product map"
  ON public.ghl_product_tier_map FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated read ghl product map"
  ON public.ghl_product_tier_map FOR SELECT
  TO authenticated USING (true);

CREATE TRIGGER ghl_product_tier_map_updated_at
  BEFORE UPDATE ON public.ghl_product_tier_map
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Claim function: copy pending row into user_subscriptions for current auth user.
CREATE OR REPLACE FUNCTION public.claim_pending_ghl_subscription()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_pending public.pending_ghl_subscriptions;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'not_authenticated');
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  IF v_email IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'no_email');
  END IF;

  SELECT * INTO v_pending
  FROM public.pending_ghl_subscriptions
  WHERE lower(email) = lower(v_email) AND claimed_at IS NULL
  LIMIT 1;

  IF v_pending.email IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'no_pending');
  END IF;

  INSERT INTO public.user_subscriptions (
    user_id, email, tier, status, source, billing_interval,
    ghl_contact_id, ghl_subscription_id, ghl_product_id,
    current_period_end, updated_at
  ) VALUES (
    v_user_id, v_email, v_pending.tier::subscription_tier, 'active', 'ghl', v_pending.billing_interval,
    v_pending.ghl_contact_id, v_pending.ghl_subscription_id, v_pending.ghl_product_id,
    v_pending.current_period_end, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    tier = EXCLUDED.tier,
    status = 'active',
    source = 'ghl',
    billing_interval = EXCLUDED.billing_interval,
    ghl_contact_id = EXCLUDED.ghl_contact_id,
    ghl_subscription_id = EXCLUDED.ghl_subscription_id,
    ghl_product_id = EXCLUDED.ghl_product_id,
    current_period_end = EXCLUDED.current_period_end,
    email = EXCLUDED.email,
    updated_at = now();

  UPDATE public.pending_ghl_subscriptions
  SET claimed_at = now()
  WHERE email = v_pending.email;

  RETURN jsonb_build_object('claimed', true, 'tier', v_pending.tier);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_pending_ghl_subscription() TO authenticated;
