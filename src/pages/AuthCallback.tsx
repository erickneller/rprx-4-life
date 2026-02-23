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
