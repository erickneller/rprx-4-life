import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  useEffect(() => {
    supabase.auth.getSession().then(() => {
      if (window.opener) {
        // Notify parent window that OAuth is complete
        window.opener.postMessage({ type: 'oauth-complete' }, window.location.origin);
        window.close();
      } else {
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
