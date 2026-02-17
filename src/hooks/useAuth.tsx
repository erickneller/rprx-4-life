import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) return { error };

    if (data?.url) {
      const popup = window.open(data.url, 'google-oauth', 'width=500,height=600');
      if (!popup) {
        return { error: { message: 'Please allow popups for this site to sign in with Google, then try again.' } as any };
      }

      return new Promise<{ error: any }>((resolve) => {
        const cleanup = () => {
          window.removeEventListener('message', messageHandler);
          clearInterval(pollInterval);
          clearTimeout(timeout);
        };

        // Listen for postMessage from the popup callback page
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (event.data?.type !== 'oauth-complete') return;
          cleanup();
          popup?.close();
          resolve({ error: null });
          window.location.reload();
        };
        window.addEventListener('message', messageHandler);

        // Fallback: poll popup.closed (may not work due to COOP, but harmless)
        const pollInterval = setInterval(async () => {
          try {
            if (popup.closed) {
              clearInterval(pollInterval);
              // Give a moment for auth state to propagate
              await new Promise(r => setTimeout(r, 1000));
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session) {
                cleanup();
                resolve({ error: null });
                window.location.reload();
              }
            }
          } catch {}
        }, 1000);

        const timeout = setTimeout(() => {
          cleanup();
          resolve({ error: { message: 'Sign in timed out. Please try again.' } as any });
        }, 120000);
      });
    }

    return { error: null };
  };

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPasswordForEmail,
    updatePassword,
  };
}
