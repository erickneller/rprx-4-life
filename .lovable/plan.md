

# Fix: Restrict prompt_templates SELECT to admins only

## Problem
The `prompt_templates` table SELECT policy allows any authenticated user to read AI system prompts, exposing internal business logic.

## Fix
Replace the current permissive SELECT policy with one restricted to admins:

**Migration SQL:**
```sql
DROP POLICY "Authenticated users can read prompt templates" ON public.prompt_templates;

CREATE POLICY "Admins can read prompt templates"
ON public.prompt_templates
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

## Impact
- The edge function (`rprx-chat`) reads prompt_templates using the **service role client**, which bypasses RLS entirely -- no breakage.
- The only client-side reader is the admin `PromptTemplatesTab`, which is already behind the `AdminRoute` guard and accessed by admins -- no breakage.
- Single migration, no code changes needed.

