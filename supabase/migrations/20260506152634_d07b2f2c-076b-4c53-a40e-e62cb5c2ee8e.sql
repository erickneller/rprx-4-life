DROP POLICY IF EXISTS "Anyone can submit health assessments" ON public.assessment_submissions;
ALTER TABLE public.assessment_submissions ADD COLUMN IF NOT EXISTS submitter_ip inet;