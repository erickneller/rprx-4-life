
# Live User Testing Readiness — Gaps Addressed

## Verified (No Changes Needed)

| Gap | Result |
|-----|--------|
| Dashboard card order | ✅ Matches PRD exactly: Daily Journey (1) → Money Leak (2) → Current Focus (3) → RPRx Score (4) → Cash Flow (5) → My Strategies (6) → Recent Achievements (7) |
| Day 1 CTA context-aware states | ✅ `useDayOneCTA` covers all 4 PRD states: build → activate → view_leak → see_results |
| Money Leak never $0 | ✅ Already has `Math.max(low, 500)` / `Math.max(high, 1500)` floor in `calculateInitialLeakEstimate` |

## Fixed

| Gap | Fix |
|-----|-----|
| RPRx Score never zero | Added minimum floor of 5 in `rprxScoreEngine.ts` — score clamps to [5, 100] instead of [0, 100] |

## Remaining Risks (Non-blocking for soft launch)

- **Assessment transaction atomicity**: Sequential writes with `hadNonCriticalFailure` flags. Acceptable for 5-10 testers; monitor for broken states.
- **Mobile polish**: Sidebar resize handle, card layouts, and chat FAB positioning should be tested on small viewports.
- **30-day journey Days 2-30**: Content needs to be seeded in `onboarding_content` table for all horseman types beyond Day 1.
