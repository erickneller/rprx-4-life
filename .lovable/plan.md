## Skip contact step for authenticated users

In-app, the health assessment lives behind auth/paywall — we already have the user's name, email, phone in their profile, so the "You're Almost Done!" contact gate is redundant friction. The embedded (anonymous) widget on the marketing site still needs it for lead capture.

### Changes

**`src/pages/HealthAssessment.tsx`**
- When `user` is signed in (not embedded), treat Step 5 as auto-submit: skip rendering `<Step5Contact />` and instead call a shared submission helper as soon as the user completes Step 4, then jump to Step 6 (results).
- Embedded/anonymous flow is unchanged — still shows Step 5.

**`src/components/health-assessment/Step4Goals.tsx`** (Next button handler)
- If authenticated and not embedded: pull `first_name`, `last_name`, `email`, `phone` from `useProfile()`, write them into the store as `contact` (with `consent: true` since they're already a registered user), run the same submission payload that Step5Contact builds, invoke `submit-health-assessment`, then `setCurrentStep(6)`.
- Otherwise: behave as today (advance to Step 5).

**Extract shared submit helper** → new `src/utils/health/submitAssessment.ts`
- Move the payload construction + `supabase.functions.invoke('submit-health-assessment', …)` call out of `Step5Contact` so both Step 4 (auth path) and Step 5 (anon path) can call it without duplication. Keeps scoring/snapshot/BMI logic identical.

**`PhysicalSnapshotReport.tsx`**
- No change to the existing per-user upsert into `user_health_assessments` — it already runs on Step 6 mount.

### Out of scope
- No changes to the embed flow, Step 5 component itself, GHL webhook, scoring, or DB schema.
- No new "Skip" UI — for signed-in users, Step 5 simply never appears.

### Result
Signed-in users finishing Step 4 → brief "Saving…" state → land directly on the Physical Snapshot report. Embedded anonymous visitors still see the contact gate.
