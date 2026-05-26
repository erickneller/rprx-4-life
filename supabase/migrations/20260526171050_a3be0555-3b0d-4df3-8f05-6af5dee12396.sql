CREATE TYPE public.support_request_type AS ENUM ('help','bug','feature','advisor');
CREATE TYPE public.support_request_status AS ENUM ('new','in_progress','resolved','archived');

CREATE TABLE public.support_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type public.support_request_type NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  page_url text,
  user_agent text,
  status public.support_request_status NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_requests TO authenticated;
GRANT ALL ON public.support_requests TO service_role;

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own support requests" ON public.support_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own support requests" ON public.support_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins full access support requests" ON public.support_requests
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_support_requests_updated_at
  BEFORE UPDATE ON public.support_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_support_requests_user ON public.support_requests(user_id, created_at DESC);
CREATE INDEX idx_support_requests_status ON public.support_requests(status, created_at DESC);