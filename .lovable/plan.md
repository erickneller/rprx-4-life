
## Goal

Port the standalone RPRx Health Assessment (project `a93384cd…`) into this app as a **public, unauthenticated** route at `/health-assessment`. Persist submissions to Supabase and forward them to GoHighLevel through a signed edge function — same architecture as the source project.

## What gets copied (verbatim, paths preserved where possible)

**Components** → `src/components/health-assessment/`
- `WelcomeScreen.tsx`
- `ProgressBar.tsx`
- `Step1BasicProfile.tsx` … `Step5Contact.tsx`
- `ResultsScreen.tsx`

**Store** → `src/store/healthAssessmentStore.ts` (renamed from `assessmentStore.ts` to avoid colliding with the existing financial assessment under `src/components/assessment/`)

**Utils** → `src/utils/health/`
- `scoring.ts`
- `pdfGenerator.ts`
- `webhookSigner.ts`

All `@/store/assessmentStore` imports inside the copied files are rewritten to `@/store/healthAssessmentStore`, and `@/utils/...` imports are rewritten to `@/utils/health/...`.

**New page** → `src/pages/HealthAssessment.tsx` (mirrors source's `Index.tsx` — renders Welcome → Steps → Results based on `currentStep`).

**Route registration** in `src/App.tsx`:
```tsx
<Route path="/health-assessment" element={<HealthAssessment />} />
```
Placed **outside** `ProtectedRoute` / `WizardGuard` and above the catch-all, so it's fully public.

## Dependencies to install

- `zustand` (store)
- `jspdf` (PDF download)

`sonner`, `zod`, `lucide-react`, shadcn primitives are already present.

## Design tokens to reconcile

The copied components reference `bg-gradient-subtle`, `bg-gradient-primary`, `bg-gradient-accent`, and `font-display` — tokens that exist in the source project but may not be in this project's `tailwind.config.ts` / `index.css`. Plan: add the missing CSS gradient variables and `display` font family to `index.css` + `tailwind.config.ts` using the **existing** primary/accent HSL values from this project (no new color palette). This keeps the assessment visually consistent with the rest of the app rather than importing the source brand.

## Database

New migration creates a single table for public, anonymous submissions:

```sql
create table public.assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  personas text[] not null default '{}',
  responses jsonb not null default '{}',
  scores jsonb not null default '{}',
  opportunity_index numeric,
  tier text,
  created_at timestamptz not null default now()
);

alter table public.assessment_submissions enable row level security;

-- Public, anonymous form: anyone can insert
create policy "Anyone can submit health assessments"
  on public.assessment_submissions for insert
  to anon, authenticated
  with check (true);

-- Only admins can read submissions back
create policy "Admins can read submissions"
  on public.assessment_submissions for select
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));
```

No update/delete policies — submissions are append-only from the frontend; admins manage via SQL/dashboard if needed.

## Edge function

`supabase/functions/send-to-ghl/index.ts` — copied verbatim from the source project. It:
- Validates payload shape and field lengths
- Verifies `x-signature` + `x-timestamp` HMAC-SHA256 against `RPRX_WEBHOOK_SIGNING_SECRET` (5-min window)
- Forwards a normalized contact + customFields payload to `RPRX_GHL_WEBHOOK_URL`

`supabase/config.toml` adds:
```toml
[functions.send-to-ghl]
verify_jwt = false
```
(Required because the route is public — callers have no Supabase JWT.)

## Secrets needed

After the migration and code land, the user is prompted via `add_secret` for:
- `RPRX_GHL_WEBHOOK_URL` — GoHighLevel inbound webhook URL (edge runtime)
- `RPRX_WEBHOOK_SIGNING_SECRET` — HMAC secret used by the edge function to verify requests
- `VITE_WEBHOOK_SIGNING_SECRET` — same secret value, exposed to the Vite client so `webhookSigner.ts` can sign outgoing calls

(The two signing-secret entries must hold the **same value** — one is read at build time by Vite, the other at runtime by Deno.)

## Out of scope

- No changes to the existing financial assessment under `src/components/assessment/`
- No auth, profile, gamification, or sidebar nav integration for this route — it's a standalone public lead-capture funnel
- No admin UI for viewing submissions in this pass (admins can query the table directly)

## Order of execution after approval

1. Run the `assessment_submissions` migration
2. Install `zustand` and `jspdf`
3. Copy components, store, utils, edge function; add the public route; reconcile tokens
4. Update `supabase/config.toml` for `send-to-ghl`
5. Prompt for the three secrets via `add_secret`
