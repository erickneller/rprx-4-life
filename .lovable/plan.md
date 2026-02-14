

## Enhance Assessment Results Page

### Overview
Add two new sections to the Results page: an RPRx Score card at the top and a Quick Win Teaser card between the radar chart and the strategy generation button. Also add a new `rprx_score` column to the profiles table and a scoring utility.

---

### 1. Database Migration
Add an `rprx_score` integer column (nullable, default null) to the `profiles` table.

```sql
ALTER TABLE public.profiles ADD COLUMN rprx_score integer NULL;
```

### 2. New Utility: `src/lib/rprxScore.ts`
- Export a `calculateRPRxScore(profile)` function that returns a number:
  - Base: 100 points for assessment completion (always true on the results page)
  - Profile completeness bonus (up to 50 points): check fields like `full_name`, `phone`, `monthly_income`, `monthly_debt_payments`, `monthly_housing`, `monthly_insurance`, `monthly_living_expenses`, `profile_type`, `financial_goals`, `filing_status` -- each filled field adds ~5 points (10 fields x 5 = 50)
- Export a `getRPRxTier(score)` function returning `{ emoji, label }`:
  - 0-199: "Awakening" (red circle emoji)
  - 200-399: "Reducing" (orange circle emoji)
  - 400-599: "Paying" (yellow circle emoji)
  - 600-799: "Recovering" (green circle emoji)
  - 800-1000: "Thriving" (diamond emoji)

### 3. New Component: `src/components/results/RPRxScoreCard.tsx`
- Circular progress indicator (SVG circle) showing score out of 1000
- Displays the tier label with emoji
- Below the score: "Complete your Deep Dive to earn +75 points"
- Uses the profile data from `useProfile` and calls `calculateRPRxScore`
- On mount/render, persists the computed score to the profile via `updateProfile({ rprx_score })` if it changed

### 4. New Component: `src/components/results/QuickWinCard.tsx`
- Accepts `primaryHorseman: HorsemanType` as a prop
- Maps each horseman to its specific quick-win message
- Styled with a gradient border (blue-to-purple) using a wrapper div with `bg-gradient-to-r from-blue-500 to-purple-500 p-[2px] rounded-lg`
- Lightning bolt icon (Zap from lucide-react) next to the title
- Subtle CTA text at the bottom linking down to the strategy generation section

### 5. Update `ResultsPage.tsx`
Insert the two new sections into the page layout:
- RPRx Score card at the top (after the intro heading, before the radar chart)
- Quick Win card between the radar chart section and the Primary Horseman / Cash Flow section

### 6. Update `useProfile.ts`
- Add `rprx_score: number | null` to the `Profile` interface

### 7. Update Supabase Types
The types file will auto-update after migration, but we need to ensure `rprx_score` is included in the Profile interface manually.

---

### Technical Details

| File | Action | Description |
|------|--------|-------------|
| Migration SQL | Create | Add `rprx_score` integer column to profiles |
| `src/integrations/supabase/types.ts` | Auto-updated | Will reflect new column after migration |
| `src/lib/rprxScore.ts` | Create | Score calculation + tier logic |
| `src/components/results/RPRxScoreCard.tsx` | Create | Circular score display with tier |
| `src/components/results/QuickWinCard.tsx` | Create | Gradient-bordered quick win teaser |
| `src/components/results/ResultsPage.tsx` | Modify | Add both new cards to layout |
| `src/hooks/useProfile.ts` | Modify | Add `rprx_score` to Profile interface |

### Page Layout Order (after changes)
1. Intro heading
2. **RPRx Score card (NEW)**
3. Radar chart
4. **Quick Win Teaser card (NEW)**
5. Primary Horseman + Cash Flow cards
6. Diagnostic Feedback
7. Next Steps (Generate Strategies)
8. Action Buttons

