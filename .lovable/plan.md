# RPRx Physical Health Snapshot — Lead Magnet Report

Replace the current generic `ResultsScreen` with a personalized, premium snapshot report driven by the user's existing assessment answers. No intake form changes.

## 1. Database (migration)

Add columns to `assessment_submissions`:
- `primary_horseman` text
- `secondary_horseman` text
- `readiness_score` integer
- `readiness_label` text
- `recommended_track` text
- `quick_wins` jsonb (array of 3 strings)
- `report_generated_at` timestamptz

Add a feature flag row in `feature_flags`:
- `id = 'physical_advisor_booking_url'`, `value = 'https://YOUR-BOOKING-LINK-HERE.com'`

(No new RLS needed — existing policies cover both tables.)

## 2. Snapshot engine — `src/utils/health/physicalSnapshot.ts` (new)

Pure function `generatePhysicalSnapshot(store)` returning:
```
{ primaryHorseman, secondaryHorseman, horsemanScores,
  readinessScore (0–100), readinessLabel, recommendedTrack,
  quickWins: string[3], whatThisMeans, whyThisMatters, weeklyFocus[4] }
```

### Horseman scoring (Energy / Strength / Mobility / Prevention)
Apply the rule list from the spec against the existing answer keys:
- **Energy Loss**: `sleep ≤ 2`, `stress ≥ 4`, `energy ≤ 2`, `alcohol ∈ {3-5x-week, almost-daily}`, `smoking == 'yes'`, obstacles include `time` / `motivation`.
- **Strength Loss**: `exerciseDays ≤ 1`, `lifestyle ∈ {sedentary, lightly-active}`, `age ≥ 45`, primary goal in `{weight-loss, muscle-gain, strength, bodybuilding, longevity, energy}`.
- **Mobility Loss**: obstacles include `pain`, primary goal in `{mobility, injury-recovery, injury-prevention}`, `age ≥ 50`, sedentary lifestyle.
- **Prevention Gaps**: BP / cholesterol / diabetes / dentist / eye exam not current or `unsure`; `age ≥ 45` adds weight.

Each rule = 1–2 weighted points. Highest score = primary; second = secondary. Apply tie‑breakers from spec (Energy wins ties; pain → Mobility; 55+ with multiple gaps → Prevention; 45+ low exercise → Strength).

### Readiness score (0–100)
Start at 50. Add for: 2+ exercise days, healthy eating ≥ 5, sleep ≥ 4, hydration good (proxy: alcohol rarely + healthy eating), commitment ≥ 4, clear `timeHorizon`. Subtract for: sedentary, exercise ≤ 1, sleep ≤ 2, stress ≥ 4, energy ≤ 2, multiple prevention gaps. Clamp 0–100.
Label bands: 0–39 Foundation Needed · 40–59 Reset Recommended · 60–79 Momentum Builder · 80–100 Optimization Ready.

### Recommended track
Decision tree from spec, evaluated in order:
1. Mobility limiting → **Mobility and Joint Resilience**
2. Persona business-owner + (energy/strength/high stress) → **Owner Health Optimization**
3. Persona retiree or age ≥ 60 → **Retirement Health Preservation**
4. Persona salesperson/wage-earner/investor + perf goals → **Performance and Confidence Reset**
5. Sleep poor + stress high + energy low → **Recovery and Resilience Track**
6. Goal `weight-loss` → **Fat Loss Foundation**
7. Goal `strength`/`muscle-gain` → **Strength and Muscle Base**
8. Else (sedentary, simple start) → **Foundation Reset**

### Quick wins
Pick 3 from a pool, prioritized by primary horseman + obstacles + missing screenings (e.g. Prevention primary → "Schedule the BP/cholesterol follow-up"; Energy → sleep + hydration win; Mobility → 5-min mobility routine).

## 3. New report UI — `src/components/health-assessment/PhysicalSnapshotReport.tsx`

Premium mobile-first layout with the 11 sections from the spec:
1. Header — "Your RPRx Physical Health Snapshot" + subtitle
2. Personalized opening (uses `firstName`, soft language)
3. Hero result card — 4 stat tiles: Primary, Secondary, Readiness Score (radial progress), Recommended Track. Icons per horseman (Battery / Dumbbell / Move / ShieldCheck from lucide).
4. What This Means — primary horseman paragraph (4 variants)
5. Why This Matters — persona-specific paragraph (8 variants + default)
6. Your Recommended Track — track name + description
7. Top 3 Quick Wins — checklist cards
8. 30-Day Starter Focus — 4 week cards, copy varies by primary horseman
9. RPRx Method — Reduce / Pay / Recover trio
10. Advisor CTA — headline, support copy, primary `Book My RPRx Physical Health Advisor Call` button (uses booking URL from flag), secondary disclaimer line. Repeated near top and bottom.
11. Disclaimer (exact text)

Action row: `Book My Advisor Call` · `Email Me My Results` · `Print / Save PDF` (window.print).

Design tokens: deep navy + teal accent + soft gold highlight via existing `--primary` / `--accent` HSL tokens; no hard-coded colors.

## 4. Wiring

- `src/pages/HealthAssessment.tsx`: replace `<ResultsScreen />` at step 6 with `<PhysicalSnapshotReport />`.
- `src/components/health-assessment/Step5Contact.tsx` (or wherever submit happens): after `submit-health-assessment` succeeds, call `generatePhysicalSnapshot(store)` and store the snapshot in zustand for the report. (No need to re-call edge function — pass derived fields in the same submission.)
- Update `supabase/functions/submit-health-assessment/index.ts` to accept and persist the new snapshot fields, and forward them to GHL in the `send-to-ghl` payload (so the GHL workflow can email the report).
- New hook `useBookingUrl()` reads `feature_flags` row `physical_advisor_booking_url`, falling back to placeholder.
- "Email Me My Results" button: calls `send-to-ghl` again with `{ trigger: 'email_snapshot', email, snapshot }` so a GHL workflow can email it; show toast "We just emailed your snapshot."

## 5. Admin panel

Add a small "Physical Health Snapshot" settings card in `AdminPanel.tsx` with one input bound to feature flag `physical_advisor_booking_url`, save button uses existing flag update pattern.

## Out of scope
- No changes to the intake wizard.
- No new auth, no PDF generation library work (browser print is sufficient).
- Existing `ResultsScreen` and `pdfGenerator` left alone (could be removed later, but kept to avoid scope creep).

## Files
**New:** `src/utils/health/physicalSnapshot.ts`, `src/components/health-assessment/PhysicalSnapshotReport.tsx`, `src/hooks/useBookingUrl.ts`, plus migration.
**Edited:** `src/pages/HealthAssessment.tsx`, `src/components/health-assessment/Step5Contact.tsx`, `supabase/functions/submit-health-assessment/index.ts`, `src/pages/AdminPanel.tsx`.
