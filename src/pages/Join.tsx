import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useProfile } from '@/hooks/useProfile';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { useFirstLoginFlow } from '@/hooks/useFirstLoginFlow';
import { resolveOnboardingPreset, resolveOnboardingRoute, type FirstLoginFlowPreset } from '@/lib/firstLoginFlow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import rprxLogo from '@/assets/rprx-logo.png';


interface PendingCompany {
  id: string;
  name: string;
  invite_token: string;
  first_login_flow: FirstLoginFlowPreset | null;
}

/**
 * /join?token=<invite_token>
 *
 * Two flows:
 *   1. Already logged in  → join company immediately → /dashboard
 *   2. Not logged in       → show company name (locked) + signup form
 *                          → after signup, join company → destination per First-Login Flow
 */
export default function Join() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinByToken } = useCompany();
  const { isProfileComplete, isLoading: profileLoading } = useProfile();
  const { data: assessments, isLoading: assessmentsLoading, isFetched: assessmentsFetched } = useAssessmentHistory();
  const { preset, isLoading: presetLoading } = useFirstLoginFlow();

  const [pendingCompany, setPendingCompany] = useState<PendingCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingNavigate, setPendingNavigate] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);


  // Sign-up form state (used when not authenticated)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ─── Step 1: Look up company from token ──────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setError('Missing invite token. Please use the full invite link.');
      setLoading(false);
      return;
    }

    async function lookup() {
      const { data, error: err } = await supabase
        .rpc('lookup_company_by_invite_token', { _token: token });

      const match = Array.isArray(data) ? data[0] : data;

      if (err || !match) {
        setError('This invite link is invalid or has expired.');
      } else {
        setPendingCompany({
          id: match.id,
          name: match.name,
          invite_token: token,
          first_login_flow: (match.first_login_flow ?? null) as FirstLoginFlowPreset | null,
        });
        // Persist token so useProfile can pick it up after Google OAuth
        localStorage.setItem('pending_invite_token', token);
      }
      setLoading(false);
    }

    lookup();
  }, [token]);

  // ─── Step 2a: Already logged in OR just-signed-up → join + redirect ──────
  useEffect(() => {
    if (!user || !pendingCompany || loading) return;
    // Always wait for the first-login preset so we can honor admin config
    if (presetLoading) return;

    const effectivePreset = resolveOnboardingPreset({
      globalPreset: preset,
      companyPreset: pendingCompany.first_login_flow,
    });
    const isDashboardOnly = effectivePreset === 'dashboard_silent' || effectivePreset === 'dashboard_nudge';

    // For presets that may compute a wizard/assessment destination,
    // wait until profile + assessments are loaded so the dest is correct.
    if (!isDashboardOnly && (profileLoading || assessmentsLoading || !assessmentsFetched)) return;

    let cancelled = false;
    async function autoJoin() {
      try {
        if (!hasJoined) {
          await joinByToken(token);
          if (cancelled) return;
          setHasJoined(true);
          toast.success(`You've joined ${pendingCompany!.name}!`);
        }
        if (isDashboardOnly) {
          navigate('/dashboard', { replace: true });
          return;
        }
        const hasAssessments = (assessments || []).some(a => a.completed_at);
        const routeDecision = resolveOnboardingRoute(
          { isProfileComplete, hasAssessments },
          { preset: pendingCompany!.first_login_flow, enabled: pendingCompany!.first_login_flow != null },
          { preset },
        );
        navigate(routeDecision.route ?? '/dashboard', { replace: true });
      } catch (err: any) {
        if (!cancelled) setError(err.message ?? 'Failed to join company.');
      }
    }

    autoJoin();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, pendingCompany, loading, presetLoading, profileLoading, assessmentsLoading, assessmentsFetched, preset, isProfileComplete]);

  // ─── Step 2b: Sign-up form submit ─────────────────────────────────────────
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingCompany) return;

    setSubmitting(true);
    setError(null);

    try {
      const { error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
          },
        },
      });

      if (signUpErr) throw signUpErr;

      // Token is in localStorage; useProfile.ts will pick it up on profile creation.
      // The autoJoin effect above will handle joining + redirecting once auth state
      // updates AND preset/profile/assessment queries have resolved.
      toast.success(`Account created! Welcome to ${pendingCompany.name}.`);
      setPendingNavigate(true);
    } catch (err: any) {
      setError(err.message ?? 'Sign-up failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Loading state ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────────────────────
  if (error && !pendingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold">Invalid Invite Link</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => navigate('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  // ─── Logged-in or just-signed-up: show joining spinner ──────────────────
  if (user || pendingNavigate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto" />
          <p className="text-muted-foreground">Setting things up…</p>
        </div>
      </div>
    );
  }

  // ─── Sign-up form (unauthenticated) ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Spinning logo */}
        <div className="flex justify-center" style={{ perspective: '1000px' }}>
          <img src={rprxLogo} alt="RPRx Logo" className="w-20 h-20 animate-spin-y" />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">You've been invited</h1>
          <p className="text-muted-foreground text-sm">
            Create your free account to join <span className="font-semibold text-foreground">{pendingCompany?.name}</span> on RPRx 4 Life.
          </p>
        </div>

        {/* Sign-up form */}
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-1">
            <Label>Company</Label>
            <Input value={pendingCompany?.name ?? ''} disabled className="bg-muted cursor-not-allowed" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="Jane Smith"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 555 000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
            </p>
          )}

          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Account &amp; Join
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <a href={`/auth?redirect=/join?token=${token}`} className="underline hover:text-foreground">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
