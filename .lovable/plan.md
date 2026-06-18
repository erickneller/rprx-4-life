## Add Google Sign-Up to Company Join Page

### Behavior
- Add "Sign up with Google" button on the company join page (`src/pages/Join.tsx`), styled consistently with the existing Google button on `/auth`.
- **Phone required:** Before initiating Google OAuth, validate that the phone field on the join form is filled (and matches the same format used on `/auth`). If empty/invalid, show an inline error and block the OAuth redirect.
- **Silent join for existing accounts:** If the Google user already has an account, they're signed in normally and auto-attached to the company via the existing `pending_invite_token` flow in `useProfile` — no warning, no extra prompt.

### Implementation

1. **`src/pages/Join.tsx`**
   - Add a `Sign up with Google` button below (or beside) the existing email/password submit, with an "or" divider matching `/auth`.
   - Handler:
     - Validate phone field; abort with toast/inline error if missing.
     - Store `pending_invite_token` (token), `pending_phone` (entered phone), and `pending_full_name` (if provided) in `localStorage` so `useProfile` can attach them post-OAuth.
     - Call `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: \`\${window.location.origin}/join/\${token}\` } })` so the user returns to the same join page; `useProfile` then attaches them to the company and the page redirects to the dashboard.

2. **`src/hooks/useProfile.ts` (or wherever `pending_invite_token` is consumed)**
   - On first sign-in after OAuth, if `pending_phone` exists in `localStorage`, persist it to the user's profile (so the phone-required rule from the join page is honored), then clear the localStorage keys.

3. **No DB or RPC changes.** Google provider is already configured in Supabase.

### Files touched
- `src/pages/Join.tsx` (button + validation + OAuth handler)
- `src/hooks/useProfile.ts` (consume `pending_phone` / `pending_full_name` after OAuth)
