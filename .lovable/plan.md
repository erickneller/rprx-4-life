

# Always Show "Continue Your Plan" Button on Money Leak Card

## Problem

The "Continue Your Plan" button is hidden whenever `totalRecovered > 0` because the recovery progress bar takes its place in an exclusive if/else branch. Once any plan has progress, the button disappears permanently.

## Solution

Show the "Continue Your Plan" button alongside the recovery progress bar when a focus plan exists and is not yet complete. This is a single-file change to `MoneyLeakCard.tsx`.

### File: `src/components/money-leak/MoneyLeakCard.tsx`

Change the recovery/CTA section (lines 133-165) from an exclusive if/else to:

1. **Always show recovery progress** when `totalRecovered > 0`
2. **Always show "Continue Your Plan" button** when a `focusedPlan` exists and its status is not `completed` -- rendered below the progress bar
3. Keep the "View My Plans" fallback CTA only when there's no focused plan and no recovery

This means the card will show both the progress bar AND the continue button simultaneously when applicable.

### Files Modified

- `src/components/money-leak/MoneyLeakCard.tsx` -- restructure conditional rendering

