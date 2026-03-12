

# Live User Testing Readiness Assessment

## PRD MVP Success Criteria vs. Current State

Based on a detailed review of the PRD (Section 11) and the codebase, here is where things stand:

---

### READY (Built and Functional)

| Criteria | Status |
|----------|--------|
| Sign up (email + Google OAuth + phone interstitial) | Complete |
| Profile Wizard (4 steps, all fields required, saves per step) | Complete (profile_type + tax_advantaged_accounts recently added) |
| Assessment (15 core questions + deep dive per horseman) | Complete |
| RPRx Score calculated on submission (5 pillars, grade, tier) | Complete |
| Money Leak Estimator (dollar range from primary horseman + income) | Complete |
| Focus plan auto-generated on assessment completion | Complete (AI-first with fallback to strategy definitions) |
| Strategy auto-activated for primary horseman | Complete |
| Dashboard with configurable card layout | Complete |
| Daily Check-In card (strategy progress) | Complete |
| Login Streak tracking + display | Complete |
| Gamification (XP, badges, tiers, streak counter) | Complete |
| AI Chat Assistant (context-seeded, feature-flagged) | Complete |
| Admin panel (users, wizard copy, dashboard config, page help, prompts, features) | Complete |
| Debt Eliminator (built, out-of-scope for MVP promotion per PRD) | Complete |
| Contextual Help drawer with "Ask RPRx" bridge | Complete |
| Edit assessment answers flow | Complete |
| Sidebar navigation + resizable | Complete |

---

### GAPS / RISKS to address before live testers

#### 1. 30-Day Onboarding Journey — Partially Built, Needs Verification
The PRD defines this as the *primary returning-user engagement loop* (Days 1-30 with phases: Clarity → Awareness → Second Win → Identity → Vision). The `useOnboarding` hook and `onboarding_content` table exist, but:
- **Day 1 CTA context-aware states** (Section 5.1) need verification — the PRD specifies 4 distinct states based on plan/strategy/leak status
- Need to confirm `DailyCheckIn` component maps to the journey card described in the PRD vs. just being a strategy check-in
- Journey streak vs. login streak distinction (PRD defines both separately)

#### 2. Dashboard Card Order
PRD specifies a specific card order: Daily Journey → Money Leak → Current Focus → RPRx Score → Cash Flow → My Strategies → Recent Achievements. Need to verify the `dashboard_card_config` seed matches this.

#### 3. Assessment "Single Transaction" Requirement
The PRD states all post-assessment writes should fire in a single transaction. The current `useAssessment.ts` uses sequential writes with `hadNonCriticalFailure` flags — meaning partial failures are possible (e.g., score writes but onboarding row doesn't). This is a documented risk but could cause a broken state for testers.

#### 4. RPRx Score Never Zero
PRD criterion: "See their RPRx Score immediately (never zero)". The score calculation depends on fresh profile data. If any profile field is null, certain pillars could score 0. Need a floor/minimum score safeguard.

#### 5. Money Leak Never $0
PRD criterion: "See their money leak estimate (never $0 for a complete profile)". The `calculateInitialLeakEstimate` function needs a guaranteed minimum for complete profiles.

#### 6. Mobile-First Polish
PRD says "Primary device: mobile with desktop support." The app is functional on mobile but the sidebar resize handle, some card layouts, and the floating chat button positioning should be tested on small viewports.

---

### RECOMMENDATION

**The app is roughly 85-90% ready for a soft launch with 5-10 testers.** The core happy path (signup → wizard → assessment → score → plan → dashboard) is solid. The main risks are:

1. **Verify the 30-day journey flow** works correctly for Day 1 through Day 3 (testers will hit these first)
2. **Add minimum-score guardrails** so no tester sees a $0 leak or 0 RPRx Score
3. **Test the full flow on mobile** since the PRD targets mobile-first users
4. **Verify Day 1 CTA states** match the 4 scenarios in PRD Section 5.1

If you want, I can create a plan to address these gaps, or we can start by testing the current flow end-to-end to see what actually breaks.

