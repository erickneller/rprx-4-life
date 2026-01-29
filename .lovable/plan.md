
## Add Logo Above "RPRx 4 Life" Text on Auth Page

### Overview
Add the RPRx logo (circular logo with caduceus and dollar sign) above the "RPRx 4 Life" title text in the authentication page card header.

---

## Implementation

### File: `src/pages/Auth.tsx`

**1. Add import for the logo (at top of file):**
```tsx
import rprxLogo from '@/assets/rprx-logo.png';
```

**2. Update CardHeader (lines 179-182) to include logo image:**

The logo will be centered above the title text with appropriate sizing.

```tsx
<CardHeader className="text-center">
  <div className="flex justify-center mb-4">
    <img 
      src={rprxLogo} 
      alt="RPRx Logo" 
      className="h-24 w-24 object-contain" 
    />
  </div>
  <CardTitle className="text-2xl font-bold">RPRx 4 Life</CardTitle>
  <CardDescription>Sign in to your account or create a new one</CardDescription>
</CardHeader>
```

---

## Visual Result

| Element | Change |
|---------|--------|
| Auth Card Header | Displays circular RPRx logo (96x96px) centered above "RPRx 4 Life" text |

The logo is already in the project assets (`src/assets/rprx-logo.png`), so no new file needs to be copied.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Import logo and add image element in CardHeader |
