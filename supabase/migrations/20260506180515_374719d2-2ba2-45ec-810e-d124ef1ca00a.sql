ALTER TABLE public.assessment_submissions
  ADD COLUMN IF NOT EXISTS primary_horseman text,
  ADD COLUMN IF NOT EXISTS secondary_horseman text,
  ADD COLUMN IF NOT EXISTS readiness_score integer,
  ADD COLUMN IF NOT EXISTS readiness_label text,
  ADD COLUMN IF NOT EXISTS recommended_track text,
  ADD COLUMN IF NOT EXISTS quick_wins jsonb,
  ADD COLUMN IF NOT EXISTS report_generated_at timestamptz;

INSERT INTO public.feature_flags (id, value, enabled)
VALUES ('physical_advisor_booking_url', 'https://YOUR-BOOKING-LINK-HERE.com', true)
ON CONFLICT (id) DO NOTHING;