

## Force invite links to use the production custom domain

### Problem
`buildInviteUrl()` in `src/hooks/useCompany.ts` uses `window.location.origin`, so invite links generated from the Lovable preview/editor produce ugly URLs like:
```
https://81677757-...lovableproject.com/join?token=...
```
These work, but expose Lovable branding and break if the preview URL ever changes.

### Fix (1 file)

**`src/hooks/useCompany.ts`** — replace the `buildInviteUrl` helper:

```ts
const PRODUCTION_ORIGIN = 'https://app.rprx4life.com';

export function buildInviteUrl(token: string): string {
  // Always use production domain for invite links, regardless of where
  // they're generated (preview, localhost, or production itself).
  return `${PRODUCTION_ORIGIN}/join?token=${token}`;
}
```

That's the entire change. Every place that calls `buildInviteUrl(token)` (CompanyDashboard, admin CompaniesTab, anywhere else) will instantly produce clean `https://app.rprx4life.com/join?token=...` URLs.

### Why this is safe
- `/join` route is registered in `App.tsx` and works on every deployed origin (preview + production).
- The token lookup (`lookup_company_by_invite_token` RPC) is origin-agnostic — only the token matters.
- A user clicking a production-domain invite link from their email will land on the live app, sign up, and join the company exactly as before.

### Verification
- Open the admin **Companies** tab (or company dashboard) → click "Copy invite link" → paste into a notepad → URL starts with `https://app.rprx4life.com/join?token=…` even when copied from the preview.
- Open that link in a private window → join flow renders correctly.

### Files touched
- `src/hooks/useCompany.ts`

### Out of scope
- No DB, RLS, or routing changes.
- No environment variable plumbing — the production domain is stable and known, so a single constant is simpler than `import.meta.env` for this case. (If you'd ever want it configurable, we can swap to `VITE_PUBLIC_APP_URL` in a follow-up.)

