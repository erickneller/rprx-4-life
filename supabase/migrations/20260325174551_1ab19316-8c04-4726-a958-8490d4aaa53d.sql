DROP POLICY "Authenticated users can read prompt templates" ON public.prompt_templates;

CREATE POLICY "Admins can read prompt templates"
ON public.prompt_templates
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));