

## Update Start Assessment Button to Cobalt Blue

### Overview
Change the "Start Assessment" button in the dashboard CTA card to use the cobalt blue accent color for consistency with other primary action buttons.

---

## Change Required

### File: `src/components/dashboard/StartAssessmentCTA.tsx`

**Line 32 - Update Button styling:**

```tsx
// Before
<Button onClick={() => navigate('/assessment')} className="w-full sm:w-auto">

// After
<Button onClick={() => navigate('/assessment')} className="w-full sm:w-auto bg-accent hover:bg-accent/90">
```

---

## Summary

| File | Change |
|------|--------|
| `src/components/dashboard/StartAssessmentCTA.tsx` | Add `bg-accent hover:bg-accent/90` to Start Assessment button |

