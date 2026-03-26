
CREATE TABLE public.knowledge_base (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  source_url text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  last_synced_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage knowledge base" ON public.knowledge_base
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
