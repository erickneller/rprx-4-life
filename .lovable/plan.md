

User: admins should bypass the 1-plan free-tier limit on the Results page (SuggestedPromptCard). Looking at the code, `useSubscription` already returns `isPaid: true` for admins, but `SuggestedPromptCard.tsx` has a hardcoded `const isFree = true;` — that's the bug shown in the screenshot.

Also check `autoStrategyGenerator` for any internal limit. Let me verify.
<lov-plan>
<lov-tool-use id="toolu_vrtx_01VxMyr8PLXCtjvTmiBB2euB" name="code--search_files" integration-id="code" data="{\"query\": \"existingPlanNames|existingPlans.length|plan limit\", \"include_patterns\": \"src/**/*.ts,src/**/*.tsx\"}">
</lov-tool-use>

<lov-tool-use id="toolu_vrtx_01DJQrUEceJxVA7BpC5xF1kT" name="code--search_files" integration-id="code" data="{\"query\": \"existingPlans.length|isFree.*plan|plan limit|atLimit\", \"include_patterns\": \"src/**/*.ts,src/**/*.tsx\"}">
</lov-tool-use>
SavePlanModal already uses `useSubscription` (admins return 'paid' → isFree=false → unlimited). The gaps are in `SuggestedPromptCard.tsx` (hardcoded `isFree = true`), `useDayOneCTA.ts`, and `ChatThread.tsx`. Let me confirm ChatThread's source.
<lov-tool-use id="toolu_vrtx_01A2c84eSu8xCSbMcgftknr7" name="code--search_files" integration-id="code" data="{\"include_patterns\": \"src/components/assistant/ChatThread.tsx,src/hooks/useDayOneCTA.ts\", \"query\": \"isFree|useSubscription|isAdmin\"}">
</lov-tool-use>
ChatThread already correctly uses `useSubscription` (admins bypass). So only `SuggestedPromptCard.tsx` and `useDayOneCTA.ts` need fixes. Now let me check "strategies" — what are admin-created strategies? Likely the `strategy_definitions`/admin panel. Let me check briefly.
<lov-tool-use id="toolu_vrtx_01QT8QNg26mpBuhzcCrqtr4x" name="code--search_files" integration-id="code" data="{\"include_patterns\": \"src/**/*.ts,src/**/*.tsx\", \"query\": \"strategy.*limit|strategies.*limit\"}">
</lov-tool-use>
No admin-side strategy creation limits exist — only plan-save limits. The user's concern reduces to: "admins shouldn't hit the 1-plan cap anywhere." Two spots still hardcode it.

<lov-plan>

## Lift plan-cap for admins everywhere

**Audit result:** `SavePlanModal.tsx` and `ChatThread.tsx` already gate via `useSubscription` (admins → `isPaid` → unlimited). Two spots still hardcode the free-tier cap and bypass admin/paid status:

### Fixes

**1. `src/components/results/SuggestedPromptCard.tsx` (line 71)**
- Remove `const isFree = true;` hardcode.
- Import and use `useSubscription()` → use real `isFree` value.
- Result: admins (and paid users) can generate unlimited strategies from the Results page "Generate My Next Strategy" button — fixing the red "Plan limit reached" toast shown in the screenshot.

**2. `src/hooks/useDayOneCTA.ts` (line 107)**
- Add `useSubscription()` (or `useAdmin()`) check.
- Only enforce `plans.length >= 1` block when `isFree` is true.
- Result: admins can trigger Day-1 plan generation without the cap.

### Notes on "unlimited strategies"
- There is no per-user cap on **creating strategy definitions** in the admin panel (`AdminPanel` → Strategies tab uses `useAdminStrategies` with no count limits). No change needed.
- "Strategies" in the user-facing context = saved implementation plans, which is what these two fixes address.

### Verification path after deploy
- Sign in as admin → Results page → click **Generate My Next Strategy** with ≥1 existing plan → should generate, not toast.
- Sign in as admin → Dashboard Day-1 CTA with ≥1 plan → should proceed.
- Sign in as free user → both flows should still show the friendly limit message.

No engine, scoring, schema, or RLS changes. Two files touched.

