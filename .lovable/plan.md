

# Fix: Sync New Users to GHL on Signup

## Current Gap
The `ghl-sync` edge function only fires when `updateProfile` succeeds (e.g., during wizard or profile edits). When a brand new user signs up, the profile is created via `insert` in `useProfile`'s query function, but no GHL sync is triggered.

## Fix

In `src/hooks/useProfile.ts`, after the new profile is successfully inserted (lines 90-101), invoke `ghl-sync` with the new user's data:

```typescript
// After line 100 (if (insertError) throw insertError;)
// Sync new user to GHL
supabase.functions.invoke('ghl-sync', {
  body: {
    full_name: newProfile.full_name,
    phone: newProfile.phone,
  },
}).catch((err) => {
  console.warn('GHL sync on signup failed (non-blocking):', err);
});
```

This is non-blocking (`.catch`) so it won't break signup if GHL is unavailable.

## The `ghl-sync` Function Also Needs the User's Email
The function currently gets the email from the JWT claims (`claimsData.claims.email`). This works because the frontend sends the user's auth token automatically via `supabase.functions.invoke()`. No code change needed in the edge function for this.

## Testing
After the fix, we can test by:
1. Creating a new test account in the app
2. Checking the `ghl-sync` edge function logs to see if the upsert succeeded
3. Verifying the contact appears in your GHL location

## One Issue in `ghl-sync`
The function uses `supabase.auth.getClaims(token)` which is not a standard Supabase JS method. It should use `supabase.auth.getUser(token)` instead. This needs to be fixed or the function will fail at runtime.

## Files to Modify
- `src/hooks/useProfile.ts` — add GHL sync after new profile insert
- `supabase/functions/ghl-sync/index.ts` — fix auth validation method

