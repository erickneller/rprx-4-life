

# Auto-Activate Plan on Generation

## Problem

When a plan is auto-generated (from dashboard Day 1 CTA or assessment completion), it's created with `is_focus = false` and no corresponding `user_active_strategies` row. This means:
- The money leak card can't find a focused plan to link to
- The Day 1 CTA state waterfall sees `activeCount === 0` and shows "Activate My First Strategy" instead of "View My Money Leak"
- The money leak card shows "Start your first plan to begin recovering" with a generic `/plans` link

## Changes

### 1. `src/lib/autoStrategyGenerator.ts` -- Add post-creation activation

After `createPlan(planData)` returns, add two Supabase calls:

**a) Set `is_focus = true`** on the newly created plan:
```typescript
await supabase
  .from('saved_plans')
  .update({ is_focus: true })
  .eq('id', plan.id);
```

**b) Insert a row into `user_active_strategies`** using the plan's `strategy_id` (if present from parsing) or by looking up the top strategy for the horseman from `strategy_definitions`:
```typescript
// Determine strategy_id: use parsed one, or look up top strategy for horseman
let strategyId = plan.strategy_id;
if (!strategyId) {
  const { data: topStrategy } = await supabase
    .from('strategy_definitions')
    .select('id')
    .eq('horseman_type', horseman)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();
  strategyId = topStrategy?.id ?? null;
}
if (strategyId) {
  await supabase
    .from('user_active_strategies')
    .insert({
      user_id: plan.user_id,
      strategy_id: strategyId,
      status: 'active',
    });
}
```

This requires passing `userId` into the `autoGenerateStrategy` params (add it to `AutoGenerateParams` interface).

### 2. `src/hooks/useDayOneCTA.ts` -- Pass userId and invalidate active strategies

- Pass `user.id` to `autoGenerateStrategy` as the new `userId` param
- After generation succeeds, also invalidate `['activeStrategiesCount']` so the CTA state recalculates immediately

### 3. `src/components/results/SuggestedPromptCard.tsx` -- Same userId pass-through

- Import `useAuth` and pass `user.id` to `autoGenerateStrategy`

### 4. `src/components/money-leak/MoneyLeakCard.tsx` -- Fix the "no recovery" CTA

Change lines 145-148 from a static text string to a button that navigates to the focus plan (or `/plans` as fallback). Since `focusedPlan` is already available from `useMoneyLeak`:

```typescript
// Replace the static "Start your first plan" text:
{result.totalRecovered > 0 ? (
  // ... existing recovery progress ...
) : focusedPlan ? (
  <Button variant="secondary" onClick={() => navigate(`/plans/${focusedPlan.id}`)}>
    Continue Your Plan <ArrowRight className="h-4 w-4 ml-2" />
  </Button>
) : (
  <p className="text-sm opacity-70">
    Start your first plan to begin recovering
  </p>
)}
```

This means when a plan exists and is focused but has 0% recovery, the card shows "Continue Your Plan" linking directly to it, rather than dead text.

## Summary of flow after fix

1. User clicks "Build My Recovery Plan" on Day 1 card
2. `autoGenerateStrategy` creates plan, sets `is_focus = true`, inserts `user_active_strategies` row
3. Dashboard queries invalidate, money leak card appears with focused plan linked
4. Day 1 CTA recalculates to `view_leak` state ("View My Money Leak")
5. User clicks "View My Money Leak", scrolls to money leak card showing "Continue Your Plan" button
6. Day 1 completes

No database schema changes needed -- all tables and columns already exist.
