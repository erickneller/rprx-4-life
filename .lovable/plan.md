

# Join Page: Spinning Logo, Branded Button, and Updated Copy

## Changes

**Modified: `src/pages/Join.tsx`**

1. **Add spinning RPRX logo** at the top of the sign-up form, matching the Auth page:
   - Import `rprxLogo` from `@/assets/rprx-logo.png`
   - Add the logo with `perspective: 1000px` wrapper and `animate-spin-y` class (same as Auth page)

2. **Update subtitle copy** from:
   > Create your free account to join **My Company ABC** on RPRX.

   To:
   > Create your free account to join **{company name}** on RPRx 4 Life.

3. **Style the submit button** with the signature blue (`bg-accent hover:bg-accent/90 text-white`) to match the brand.

4. Remove the `Building2` icon badge above the title since the logo now serves as the visual anchor. Keep the company name badge but simplify it.

## Technical Details

- Reuse `animate-spin-y` keyframe already defined in `tailwind.config.ts` (4s linear infinite rotateY)
- Import the same logo asset used across the app: `@/assets/rprx-logo.png`
- Apply `perspective: 1000px` on the wrapper div for 3D rotation effect, matching Auth page line 215

