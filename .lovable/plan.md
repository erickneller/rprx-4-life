
# Fix Google OAuth `invalid_grant` Error

## Problem

Two issues are causing intermittent OAuth failures:

1. **AuthCallback page**: Calls `supabase.auth.getSession()` which can trigger the PKCE code exchange. In React StrictMode (dev) or on re-renders, this fires twice, consuming the auth code on the first call and causing `invalid_grant` on the second.

2. **`redirectTo` uses `window.location.origin`**: When testing from the preview domain, the redirect goes to a different origin than production, which may not be registered in Google Cloud Console. This causes mismatches.

## Changes

### 1. `src/pages/AuthCallback.tsx` -- Rewrite to use `onAuthStateChange` listener

Replace the current `getSession()` call with the recommended pattern: listen for `SIGNED_IN` via `onAuthStateChange` and let Supabase handle the PKCE exchange automatically. Add a `useRef` guard to prevent double-firing in StrictMode.

```typescript
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (handled.current) return;
        if (event === 'SIGNED_IN' && session) {
          handled.current = true;
          // Signal parent window (popup flow)
          localStorage.setItem('oauth-complete', Date.now().toString());
          if (window.opener) {
            window.opener.postMessage(
              { type: 'oauth-complete' },
              window.location.origin
            );
            window.close();
          } else {
            // Full-page redirect flow
            navigate('/', { replace: true });
          }
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  );
};

export default AuthCallback;
```

Key differences from current code:
- No manual `getSession()` call -- Supabase auto-exchanges the PKCE code
- `useRef` guard prevents double-fire in StrictMode
- Uses `onAuthStateChange` to react to `SIGNED_IN` event
- Uses `navigate('/')` instead of `window.location.href` for cleaner routing

### 2. `src/hooks/useAuth.tsx` -- Hardcode `redirectTo` to production URL

Change line 60 from:
```
redirectTo: `${window.location.origin}/auth/callback`,
```
to:
```
redirectTo: `https://rprx4life.lovable.app/auth/callback`,
```

This ensures the redirect always goes to the production callback regardless of whether the user is on the preview domain. Only this one URL needs to be registered in Google Cloud Console (along with the Supabase callback URL).

### 3. Manual step (user action required)

Confirm these two URLs are in Google Cloud Console under **OAuth 2.0 Client > Authorized redirect URIs**:
- `https://rprx4life.lovable.app/auth/callback`
- `https://wkzgjvnpnhyluxvclymh.supabase.co/auth/v1/callback`

(Note: the Supabase project ID in the user's message said `vizvowohqzgduyufipdr` but the actual project ID is `wkzgjvnpnhyluxvclymh`.)
