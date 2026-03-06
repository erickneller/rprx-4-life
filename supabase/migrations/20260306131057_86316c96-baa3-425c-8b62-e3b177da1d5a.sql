
CREATE TABLE public.feature_flags (
  id TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read flags" ON public.feature_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update flags" ON public.feature_flags FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert flags" ON public.feature_flags FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
INSERT INTO public.feature_flags (id, enabled) VALUES ('chat_enabled', true);
