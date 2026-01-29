

## Make Triangle Icon Red

### Problem
The `AlertTriangle` icon next to "Primary Pressure Area" currently uses `text-destructive-foreground` which isn't rendering as red. This class is typically meant for text that appears *on top of* a destructive (red) background, not for making elements red themselves.

### Solution
Change the icon's color class from `text-destructive-foreground` to `text-destructive`, which is the actual red/danger color in the theme.

---

## File Change

**File**: `src/components/results/PrimaryHorsemanCard.tsx`

| Line | Current | New |
|------|---------|-----|
| 14 | `text-destructive-foreground` | `text-destructive` |

### Code snippet:
```tsx
<AlertTriangle className="h-5 w-5 text-destructive" />
```

---

## Result
The warning triangle icon will display in red, matching the visual intent of highlighting a "pressure area" warning.

