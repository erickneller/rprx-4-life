import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  useEffect(() => {
    // Let Supabase process the tokens from the URL hash
    supabase.auth.getSession().then(() => {
      // If opened as a popup, close it so the parent detects closure
      if (window.opener) {
        window.close();
      } else {
        // Fallback: redirect to home if not in a popup
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
