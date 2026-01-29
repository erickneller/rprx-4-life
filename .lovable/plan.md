
## Update Sign In Button to Cobalt Blue

### Problem
The "Sign In" button is using the default `primary` color (dark slate) instead of the cobalt blue `accent` color used for other interactive elements.

---

## Solution
Add `bg-accent hover:bg-accent/90` classes to the Sign In button to match the app's blue color scheme.

---

## Change Required

### File: `src/pages/Auth.tsx`

**Line 264-265 - Update Sign In button styling:**
```tsx
// Before
<Button
  className="w-full"

// After
<Button
  className="w-full bg-accent hover:bg-accent/90"
```

I'll also update the "Create Account" button (around line 310) for consistency across both auth forms.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Add `bg-accent hover:bg-accent/90` to Sign In and Create Account buttons |
