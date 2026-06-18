Update the `/partners` page to rebrand it as "Trusted Resources" and make the CTA button blue with white text.

## Changes
1. **`src/pages/Partners.tsx`**
   - Page title: `RPRx Partners` → `RPRx Trusted Resources`
   - Subheading: `Explore our trusted partner programs...` → `Explore our trusted resources...`
   - Empty state: `No partner programs are available...` → `No trusted resources are available...`
   - Button label: `Visit Partner` → `Visit Trusted Resources`
   - Button styling: apply `bg-primary text-primary-foreground` so it uses the primary brand blue with white text.

## Technical details
- Use semantic Tailwind tokens (`bg-primary` / `text-primary-foreground`) rather than hardcoded colors so light/dark mode and theme changes keep working.
- No database or route changes are required; the URL stays `/partners` for now unless you also want it renamed.

## Outcome
The page reads as "Trusted Resources" and each resource card has a blue-on-white "Visit Trusted Resources" button.