-- Migrate data off 'paid'
UPDATE public.user_subscriptions SET tier = 'partner'::subscription_tier WHERE tier = 'paid'::subscription_tier;
UPDATE public.user_subscriptions SET tier_override = 'partner'::subscription_tier WHERE tier_override = 'paid'::subscription_tier;
UPDATE public.ghl_product_tier_map SET tier = 'partner' WHERE tier = 'paid';

-- Rebuild enum without 'paid'
ALTER TYPE public.subscription_tier RENAME TO subscription_tier_old;
CREATE TYPE public.subscription_tier AS ENUM ('free', 'partner', 'pro');

ALTER TABLE public.user_subscriptions
  ALTER COLUMN tier DROP DEFAULT,
  ALTER COLUMN tier TYPE public.subscription_tier USING tier::text::public.subscription_tier,
  ALTER COLUMN tier SET DEFAULT 'free'::public.subscription_tier,
  ALTER COLUMN tier_override TYPE public.subscription_tier USING tier_override::text::public.subscription_tier;

DROP TYPE public.subscription_tier_old;