create table public.assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  personas text[] not null default '{}',
  responses jsonb not null default '{}'::jsonb,
  scores jsonb not null default '{}'::jsonb,
  opportunity_index numeric,
  tier text,
  created_at timestamptz not null default now()
);

alter table public.assessment_submissions enable row level security;

create policy "Anyone can submit health assessments"
  on public.assessment_submissions for insert
  to anon, authenticated
  with check (true);

create policy "Admins can read submissions"
  on public.assessment_submissions for select
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));