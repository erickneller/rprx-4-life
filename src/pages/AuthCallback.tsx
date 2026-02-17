import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        // Signal to parent/opener via localStorage (works even when COOP blocks window.opener)
        localStorage.setItem('oauth-complete', Date.now().toString());
      }
      // Try postMessage if opener is available
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth-complete' }, window.location.origin);
        window.close();
      } else {
        // Not a popup or COOP blocked opener — redirect directly
        window.location.href = '/';
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  );
};

export default AuthCallback;
