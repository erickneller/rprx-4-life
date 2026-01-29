

## Match Progress & Slider Colors to Cobalt Blue

### Problem
The progress bar and answer slider are currently using the dark slate `primary` color, but the rest of the app uses the cobalt blue `accent` color for interactive highlights and CTAs, creating visual inconsistency.

---

## Solution
Update the Progress and Slider UI components to use `bg-accent` instead of `bg-primary` so they match the cobalt blue used throughout the app.

---

## Changes Required

### File: `src/components/ui/progress.tsx`

**Line 16 - Change the indicator color:**
```tsx
// Before
className="h-full w-full flex-1 bg-primary transition-all"

// After
className="h-full w-full flex-1 bg-accent transition-all"
```

### File: `src/components/ui/slider.tsx`

**Line 16 - Change the range (filled track) color:**
```tsx
// Before
className="absolute h-full bg-primary"

// After
className="absolute h-full bg-accent"
```

**Line 18 - Change the thumb border color:**
```tsx
// Before
className="block h-5 w-5 rounded-full border-2 border-primary bg-background ..."

// After
className="block h-5 w-5 rounded-full border-2 border-accent bg-background ..."
```

---

## Visual Result

| Element | Before | After |
|---------|--------|-------|
| Progress bar fill | Dark slate | Cobalt blue |
| Slider filled track | Dark slate | Cobalt blue |
| Slider thumb border | Dark slate | Cobalt blue |

This will make the assessment progress and question sliders visually consistent with the rest of the app's interactive elements like buttons and links.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ui/progress.tsx` | Change `bg-primary` to `bg-accent` |
| `src/components/ui/slider.tsx` | Change `bg-primary` and `border-primary` to `bg-accent` and `border-accent` |

