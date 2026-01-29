

## Update Google Button to Branded Colors & Match Field Styling

### Overview
Update the "Continue with Google" button to use Google's official brand colors (multi-colored G logo on white background) and ensure form fields have consistent styling.

---

## Changes Required

### File: `src/pages/Auth.tsx`

**1. Update Google Button Styling (lines 194-219)**

Change the button to have:
- White background with light gray border (Google brand style)
- Dark text color
- Multi-colored Google "G" logo

```tsx
<Button
  variant="outline"
  className="w-full bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
  onClick={handleGoogleSignIn}
  disabled={isSubmitting}
>
  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
  Sign in with Google
</Button>
```

**Google Brand Colors:**
| Path | Color | Hex |
|------|-------|-----|
| Top-right curve | Blue | #4285F4 |
| Bottom curve | Green | #34A853 |
| Left curve | Yellow | #FBBC05 |
| Top-left curve | Red | #EA4335 |

---

## Visual Result

| Element | Before | After |
|---------|--------|-------|
| Google Button | Gray outline, monochrome icon | White bg, gray border, colored Google "G" |
| Button Text | "Continue with Google" | "Sign in with Google" (matches Google standard) |
| Icon Size | h-4 w-4 | h-5 w-5 (slightly larger for visibility) |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Update Google button styling and SVG fill colors |

