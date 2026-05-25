ALTER TABLE public.library_videos
  ADD COLUMN IF NOT EXISTS required_tier text NOT NULL DEFAULT 'free'
  CHECK (required_tier IN ('free','partner','pro'));

ALTER TABLE public.sidebar_nav_config
  ADD COLUMN IF NOT EXISTS required_tier text NOT NULL DEFAULT 'free'
  CHECK (required_tier IN ('free','partner','pro'));