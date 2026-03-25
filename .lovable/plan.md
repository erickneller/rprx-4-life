

# Fix Money Leak Card Dark Mode Contrast

## Problem
The card uses `text-primary-foreground` for text color. In dark mode, `--primary-foreground` is `222 47% 6%` (near-black), while `gradient-hero` is also very dark. Result: dark text on dark background = unreadable.

The horseman legend labels, the "Money Leak Estimator" header, and the main headline text are all nearly invisible.

## Fix
Replace `text-primary-foreground` with `text-white` on the card so it's always light text on the dark gradient background regardless of theme. The `gradient-hero` is always dark (navy) in both light and dark mode, so white text is always correct.

**Modified: `src/components/money-leak/MoneyLeakCard.tsx`**
- Line 89: Change `text-primary-foreground` → `text-white`
- Line 66 (compact variant): Same fix

Single-line change in one file.

