

# PRD Alignment Assessment — RPRx 4 Life MVP

## Summary

The codebase is well-aligned with the PRD on most foundational features. Below is a section-by-section status with gaps called out.

---

## Section-by-Section Status

### 1-3. Product Overview, Target User, Core Concepts — ALIGNED
- Four Horsemen model, RPRx Score with 5 pillars, Money Leak Estimator, 518 strategies, 30-day journey — all built and present in the codebase.

### 4.1-4.2. Sign Up + Auth — MOSTLY ALIGNED
- Email/password + Google OAuth implemented. Phone interstitial exists (`CompletePhone.tsx`).
- **Open issue from PRD**: Google OAuth intermittent `invalid_grant` error (callback firing `exchangeCodeForSession()` more than once). Status unknown — would need to inspect `AuthCallback.tsx`.

### 4.3. Profile Wizard — ALIGNED
- 4-step wizard with admin-editable titles (`wizard_step_content`). Saves per step. `WizardGuard` enforces completion.

### 4.4. Assessment — MOSTLY ALIGNED
- 15 questions, horseman scoring, RPRx score + pillars + money leak written on submission.
- **PRD requires**: Focus plan auto-generated + top strategy auto-activated + `user_onboarding_progress` row created — all in a single transaction on assessment submission. Need to verify these all fire reliably (especially auto-plan generation).

### 4.5. Returning User Flow — ALIGNED
- Dashboard → Daily Journey → Action → Streak flow is built.

### 5. Dashboard Card Order — PARTIALLY ALIGNED
PRD specifies this card order:
1. Daily Journey Card
2. Money Leak Estimator
3. Current Focus Plan
4. RPRx Score Card
5. Cash Flow Snapshot
6. My Strategies
7. Recent Achievements

Current order is driven by `dashboard_card_config` table sort_order. **Gap**: Need to verify the database sort_order matches the PRD order exactly. This is a data check, not a code change.

### 5.1. Day 1 CTA — Context-Aware States — NEEDS VERIFICATION
PRD defines 4 specific states for the Day 1 CTA:
| State | Behavior |
|-------|----------|
| No plan exists | "Build My Recovery Plan" → triggers auto-generation |
| Plan, no active strategy | "Activate My First Strategy" → /plans?prompt=activate |
| Plan + strategy + leak > $0 | "View My Money Leak" → scroll to money leak card |
| Plan + strategy + leak = $0 | "See My Results" → /results |

This logic lives in `OnboardingCard.tsx` and `onboarding_content` table. Would need to verify all 4 states are correctly implemented.

### 6. Gamification — ALIGNED (recently completed)
- Login streak with `DashboardStreakBar` — done (Sprint 3)
- Journey streak in `user_onboarding_progress` — done
- XP/Points visible on dashboard — done
- 25 badges across 5 categories — done
- Tiers — done
- `logActivity` integration with onboarding — done (just implemented)

### 7. AI Chat — MOSTLY ALIGNED
- `rprx-chat` edge function exists. Conversations/messages tables built.
- **PRD open issue**: "Chat not accessible from dashboard with one tap" — need to check if a quick-access CTA exists on the dashboard.
- **PRD open issue**: "rprx-chat edge function needs user score + horseman context in system prompt" — need to verify the edge function includes this context.

### 8. Admin Features — MOSTLY ALIGNED
- Wizard copy editor, dashboard card config, page help editor, prompt template editor — all built.
- **PRD open issue**: "Admin user progress dashboard not built" — `UsersTab.tsx` exists but may not show score/day/streak/plan status/last active for all users.

### 9-10. Data Model + Tech Stack — ALIGNED
All tables listed in PRD exist in the database. Tech stack matches.

### 11. MVP Success Criteria — STATUS
| Criterion | Status |
|-----------|--------|
| Sign up + wizard < 3 min | Built, needs user testing |
| Assessment → RPRx Score (never zero) | Built, needs verification |
| Money leak estimate (never $0 for complete profile) | Built, needs verification |
| Focus plan + active strategy auto-generated | Built, needs verification |
| Complete Day 1 by clicking "View My Money Leak" | Built (scroll_to fix just deployed) |
| Return next day, see Day 2 with horseman content | Built |
| Daily login streak grows | Built (Sprint 3) |

### 13. Open Issues from PRD

| Priority | Issue | Status |
|----------|-------|--------|
| **Critical** | `last_completed_date` not written on day completion | **Needs verification** — check `onboardingEngine.ts` |
| **High** | Google OAuth `invalid_grant` double-fire | **Unknown** — needs `AuthCallback.tsx` review |
| **High** | Both domains in Google Cloud Console | **Ops task** — not code |
| **Medium** | Daily check-in mechanic (one-tap yes/no for strategy progress) | **Not built** |
| **Medium** | Admin user progress dashboard | **Partially built** — `UsersTab.tsx` exists |
| **Medium** | rprx-chat needs user context in system prompt | **Needs verification** |
| **Medium** | Chat not accessible from dashboard with one tap | **Needs verification** |
| **Low** | Email re-engagement for streak at risk | **Not built** (out of scope per PRD §12) |
| **Low** | End-to-end test with fresh user | **Not done** |

---

## Top Gaps to Address (Priority Order)

1. **Critical**: Verify `last_completed_date` is written correctly in `onboardingEngine.ts` on day completion
2. **Medium**: Build the daily check-in mechanic — one-tap strategy progress check-in that fires streak + XP
3. **Medium**: Add one-tap chat access from the dashboard
4. **Medium**: Verify rprx-chat edge function includes user score/horseman/leak context
5. **Medium**: Verify admin UsersTab shows all PRD-required fields (score, day, streak, plan status, last active)
6. **Low**: Verify dashboard card sort_order matches PRD order
7. **Low**: Fresh user end-to-end test

Overall the app is approximately **80-85% aligned** with the PRD. The core flows (signup → wizard → assessment → score → plan → dashboard → journey) are all built. The main gaps are the daily check-in mechanic, chat accessibility from dashboard, and verifying the critical `last_completed_date` bug is resolved.

