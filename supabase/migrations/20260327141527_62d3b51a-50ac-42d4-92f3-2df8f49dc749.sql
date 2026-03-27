
-- Partner categories
CREATE TABLE public.partner_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read partner categories" ON public.partner_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage partner categories" ON public.partner_categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Partners
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id text NOT NULL REFERENCES public.partner_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  logo_url text,
  video_url text,
  partner_url text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read partners" ON public.partners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage partners" ON public.partners FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Company partner visibility
CREATE TABLE public.company_partner_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  visible boolean NOT NULL DEFAULT true,
  UNIQUE(company_id, partner_id)
);
ALTER TABLE public.company_partner_visibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can read visibility" ON public.company_partner_visibility FOR SELECT TO authenticated USING (is_company_member(auth.uid(), company_id));
CREATE POLICY "Company admins can manage visibility" ON public.company_partner_visibility FOR ALL TO authenticated USING (is_company_admin(auth.uid(), company_id));

-- Seed sidebar nav config for partners
INSERT INTO public.sidebar_nav_config (id, label, sort_order, visible) VALUES ('item:rprx_partners', 'RPRx Partners', 20, true) ON CONFLICT (id) DO NOTHING;
