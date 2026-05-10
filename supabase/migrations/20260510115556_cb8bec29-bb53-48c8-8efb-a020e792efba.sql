
CREATE TABLE public.ghl_field_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_field text NOT NULL,
  ghl_target_type text NOT NULL CHECK (ghl_target_type IN ('standard','custom_field','tag')),
  ghl_field_key text NOT NULL,
  transform text NOT NULL DEFAULT 'none',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ghl_field_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can insert ghl mappings" ON public.ghl_field_mappings
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update ghl mappings" ON public.ghl_field_mappings
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete ghl mappings" ON public.ghl_field_mappings
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated read ghl mappings" ON public.ghl_field_mappings
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER ghl_field_mappings_updated_at
  BEFORE UPDATE ON public.ghl_field_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.ghl_field_mappings (profile_field, ghl_target_type, ghl_field_key, transform, sort_order, notes) VALUES
  ('full_name','standard','firstName','split_first_name',10,'First name from full_name'),
  ('full_name','standard','lastName','split_last_name',20,'Last name from full_name'),
  ('email','standard','email','none',30,'Auth email'),
  ('phone','standard','phone','none',40,'Phone'),
  ('company','standard','companyName','none',50,'Company name'),
  ('profile_type','custom_field','rprx_persona','join_comma',100,'Persona / profile type'),
  ('filing_status','custom_field','rprx_filing_status','none',110,'Tax filing status'),
  ('financial_goals','custom_field','rprx_goals','join_comma',120,'Financial goals'),
  ('monthly_income','custom_field','rprx_monthly_income','number',130,'Monthly income'),
  ('monthly_debt_payments','custom_field','rprx_monthly_debt','number',140,'Monthly debt payments'),
  ('emergency_fund_balance','custom_field','rprx_emergency_fund','number',150,'Emergency fund balance'),
  ('rprx_score_total','custom_field','rprx_score','number',200,'Overall RPRx score'),
  ('rprx_grade','custom_field','rprx_grade','none',210,'RPRx grade label'),
  ('rprx_score_river','custom_field','rprx_pillar_river','number',220,'River pillar'),
  ('rprx_score_lake','custom_field','rprx_pillar_lake','number',230,'Lake pillar'),
  ('rprx_score_rainbow','custom_field','rprx_pillar_rainbow','number',240,'Rainbow pillar'),
  ('rprx_score_tax','custom_field','rprx_pillar_tax','number',250,'Tax pillar'),
  ('rprx_score_stress','custom_field','rprx_pillar_stress','number',260,'Stress pillar'),
  ('current_tier','custom_field','rprx_tier','none',300,'Engagement tier'),
  ('current_streak','custom_field','rprx_streak','number',310,'Current streak (days)'),
  ('total_points_earned','custom_field','rprx_xp','number',320,'Total XP earned'),
  ('onboarding_completed','custom_field','rprx_onboarding_done','boolean_yesno',330,'Onboarding completed'),
  ('estimated_annual_leak_low','custom_field','rprx_leak_low','number',400,'Estimated annual leak (low)'),
  ('estimated_annual_leak_high','custom_field','rprx_leak_high','number',410,'Estimated annual leak (high)'),
  ('primary_horseman','tag','horseman:{value}','lowercase',500,'Tag from latest assessment primary horseman');
