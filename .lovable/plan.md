
# Make Assessment Report Text Black for Better Readability

## Summary

Update all grayscale text in the assessment results page to use `text-foreground` (black in light mode) instead of `text-muted-foreground` (gray) for improved readability.

---

## Current State

Several components use `text-muted-foreground` which renders as a gray color (`215 16% 47%` in light mode), making text harder to read:

| Component | Elements Using Gray Text |
|-----------|-------------------------|
| ResultsPage.tsx | Header subtitle (line 54) |
| DiagnosticFeedback.tsx | "What This Means" content (line 25), "Why It Matters" content (line 32), Compounding explanation (line 47) |
| PrimaryHorsemanCard.tsx | Description text (line 23) |
| CashFlowIndicator.tsx | Description text (line 36) |

---

## Proposed Changes

Change all `text-muted-foreground` instances to `text-foreground` in the results components:

### File 1: `src/components/results/ResultsPage.tsx`

| Line | Current | New |
|------|---------|-----|
| 54 | `text-muted-foreground` | `text-foreground` |

### File 2: `src/components/results/DiagnosticFeedback.tsx`

| Line | Current | New |
|------|---------|-----|
| 25 | `text-muted-foreground` | `text-foreground` |
| 32 | `text-muted-foreground` | `text-foreground` |
| 47 | `text-muted-foreground` | `text-foreground` |

### File 3: `src/components/results/PrimaryHorsemanCard.tsx`

| Line | Current | New |
|------|---------|-----|
| 23 | `text-muted-foreground` | `text-foreground` |

### File 4: `src/components/results/CashFlowIndicator.tsx`

| Line | Current | New |
|------|---------|-----|
| 36 | `text-muted-foreground` | `text-foreground` |

---

## Visual Result

All descriptive text in the assessment report will display as:
- **Light mode**: Deep slate/black (`222 47% 11%`)
- **Dark mode**: Near-white (`210 40% 98%`)

This provides maximum contrast and readability while maintaining the design system's semantic color usage.
