import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Battery,
  Dumbbell,
  Move,
  ShieldCheck,
  CalendarCheck,
  Mail,
  Printer,
  CheckCircle2,
  Sparkles,
  Target,
  HeartPulse,
} from 'lucide-react';
import { useAssessmentStore } from '@/store/healthAssessmentStore';
import {
  generatePhysicalSnapshot,
  HORSEMAN_LABELS,
  type PhysicalHorseman,
  type PhysicalSnapshot,
} from '@/utils/health/physicalSnapshot';
import { useBookingUrl } from '@/hooks/useBookingUrl';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const HORSEMAN_ICONS: Record<PhysicalHorseman, React.ComponentType<{ className?: string }>> = {
  energy: Battery,
  strength: Dumbbell,
  mobility: Move,
  prevention: ShieldCheck,
};

function ScoreRing({ score }: { score: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(score, 100) / 100);
  return (
    <div className="relative w-28 h-28">
      <svg width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle
          cx="56" cy="56" r={radius} fill="none"
          stroke="hsl(var(--primary))" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 56 56)"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{score}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

function CTASection({ url, onEmail, emailing }: { url: string; onEmail: () => void; emailing: boolean }) {
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 print:border print:bg-transparent">
      <CardContent className="p-6 md:p-8 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
          <CalendarCheck className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Review Your Results With an RPRx Physical Health Advisor
        </h3>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Your snapshot gives you a starting point. The next step is to review your result with an RPRx Physical Health Advisor who can help you identify your highest-value starting point and discuss whether a personalized 30-day or 90-day RPRx Physical plan is a fit.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            asChild
            size="lg"
            className="bg-gradient-primary hover:opacity-90 shadow-md print:hidden"
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              <CalendarCheck className="mr-2 h-5 w-5" />
              Book My RPRx Physical Health Advisor Call
            </a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onEmail}
            disabled={emailing}
            className="print:hidden"
          >
            <Mail className="mr-2 h-5 w-5" />
            {emailing ? 'Sending…' : 'Email Me My Results'}
          </Button>
        </div>
        {/* Print-only booking URL (visible in PDF / printout) */}
        <div className="hidden print:block pt-2 space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Book Your RPRx Physical Health Advisor Call:
          </p>
          <a
            href={url}
            className="text-sm font-mono break-all underline text-primary"
          >
            {url}
          </a>
          <p className="text-xs text-muted-foreground">
            Visit the link above to schedule your complimentary call.
          </p>
        </div>
        <p className="text-xs text-muted-foreground pt-1">
          This call is educational and wellness-focused. It is not a medical consultation.
        </p>
      </CardContent>
    </Card>
  );
}

export function PhysicalSnapshotReport() {
  const store = useAssessmentStore();
  const { url: bookingUrl } = useBookingUrl();
  const { toast } = useToast();
  const [emailing, setEmailing] = useState(false);

  const snapshot: PhysicalSnapshot = useMemo(
    () => generatePhysicalSnapshot({
      persona: store.persona,
      basicProfile: store.basicProfile,
      healthHabits: store.healthHabits,
      screenings: store.screenings,
      goals: store.goals,
      contact: store.contact,
    }),
    [store],
  );

  // Persist snapshot fields to the user's most recent submission (best-effort, no blocking).
  useEffect(() => {
    if (!store.contact?.email) return;
    (async () => {
      try {
        await (supabase as any)
          .from('assessment_submissions')
          .update({
            primary_horseman: snapshot.primaryHorseman,
            secondary_horseman: snapshot.secondaryHorseman,
            readiness_score: snapshot.readinessScore,
            readiness_label: snapshot.readinessLabel,
            recommended_track: snapshot.recommendedTrack,
            quick_wins: snapshot.quickWins,
            report_generated_at: new Date().toISOString(),
          })
          .eq('email', store.contact.email!.toLowerCase())
          .order('created_at', { ascending: false })
          .limit(1);
      } catch (e) {
        console.warn('Snapshot persistence skipped:', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstName = store.contact?.firstName?.trim();
  const PrimaryIcon = HORSEMAN_ICONS[snapshot.primaryHorseman];
  const SecondaryIcon = HORSEMAN_ICONS[snapshot.secondaryHorseman];

  const handleEmail = async () => {
    if (!store.contact?.email) {
      toast({ title: 'Missing email', description: 'We need an email on file to send your snapshot.', variant: 'destructive' });
      return;
    }
    setEmailing(true);
    try {
      await supabase.functions.invoke('send-to-ghl', {
        body: {
          trigger: 'email_snapshot',
          name: `${store.contact.firstName ?? ''} ${store.contact.lastName ?? ''}`.trim(),
          email: store.contact.email,
          phone: store.contact.phone,
          persona: store.persona,
          snapshot: {
            primary_horseman: snapshot.primaryHorseman,
            secondary_horseman: snapshot.secondaryHorseman,
            readiness_score: snapshot.readinessScore,
            readiness_label: snapshot.readinessLabel,
            recommended_track: snapshot.recommendedTrack,
            recommended_track_name: snapshot.recommendedTrackName,
            quick_wins: snapshot.quickWins,
          },
        },
      });
      toast({ title: 'On its way', description: 'We just emailed your snapshot.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Could not send', description: 'Please try again or contact support.', variant: 'destructive' });
    } finally {
      setEmailing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle py-10 px-4 print:bg-background print:py-0">
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
        {/* 1. Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-primary font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> RPRx Physical
          </div>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground">
            Your RPRx Physical Health Snapshot
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your personalized wellness strategy preview based on your assessment answers.
          </p>
        </div>

        {/* 2. Personalized opening */}
        <Card>
          <CardContent className="p-6 md:p-8">
            <p className="text-base md:text-lg leading-relaxed text-foreground">
              {firstName ? `${firstName}, b` : 'B'}ased on your answers, your biggest physical wellness opportunity appears to be{' '}
              <span className="font-semibold text-primary">{HORSEMAN_LABELS[snapshot.primaryHorseman]}</span>, with{' '}
              <span className="font-semibold text-accent">{HORSEMAN_LABELS[snapshot.secondaryHorseman]}</span> as your secondary focus.
            </p>
          </CardContent>
        </Card>

        {/* 3. Hero result card */}
        <Card className="border-2 border-primary/15 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              <div className="space-y-2 text-center md:text-left">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Primary Horseman</p>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <PrimaryIcon className="w-6 h-6 text-primary" />
                  <span className="text-lg font-bold text-foreground">{HORSEMAN_LABELS[snapshot.primaryHorseman]}</span>
                </div>
              </div>
              <div className="space-y-2 text-center md:text-left">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Secondary Focus</p>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <SecondaryIcon className="w-6 h-6 text-accent" />
                  <span className="text-lg font-bold text-foreground">{HORSEMAN_LABELS[snapshot.secondaryHorseman]}</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Readiness Score</p>
                <ScoreRing score={snapshot.readinessScore} />
                <p className="text-sm font-semibold text-primary">{snapshot.readinessLabel}</p>
              </div>
              <div className="space-y-2 text-center md:text-left">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Recommended Track</p>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <Target className="w-6 h-6 text-primary" />
                  <span className="text-lg font-bold text-foreground">{snapshot.recommendedTrackName}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA early */}
        <CTASection url={bookingUrl} onEmail={handleEmail} emailing={emailing} />

        {/* 4. What This Means */}
        <Card>
          <CardContent className="p-6 md:p-8 space-y-3">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <PrimaryIcon className="w-5 h-5 text-primary" /> What This Means
            </h3>
            <p className="text-muted-foreground leading-relaxed">{snapshot.whatThisMeans}</p>
          </CardContent>
        </Card>

        {/* 5. Why This Matters */}
        <Card>
          <CardContent className="p-6 md:p-8 space-y-3">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-primary" /> Why This Matters
            </h3>
            <p className="text-muted-foreground leading-relaxed">{snapshot.whyThisMatters}</p>
          </CardContent>
        </Card>

        {/* 6. Recommended Track */}
        <Card>
          <CardContent className="p-6 md:p-8 space-y-3">
            <h3 className="text-xl font-bold text-foreground">Your Recommended Track</h3>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <p className="text-lg font-semibold text-primary">{snapshot.recommendedTrackName}</p>
            </div>
            <p className="text-muted-foreground leading-relaxed">{snapshot.recommendedTrackDescription}</p>
          </CardContent>
        </Card>

        {/* 7. Quick Wins */}
        <Card>
          <CardContent className="p-6 md:p-8 space-y-4">
            <h3 className="text-xl font-bold text-foreground">Your Top 3 Quick Wins</h3>
            <ul className="space-y-3">
              {snapshot.quickWins.map((win, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-secondary/30">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">{win}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* 8. 30-Day Starter Focus */}
        <Card>
          <CardContent className="p-6 md:p-8 space-y-4">
            <h3 className="text-xl font-bold text-foreground">Your 30-Day Starter Focus</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {snapshot.weeklyFocus.map((w) => (
                <div key={w.week} className="p-4 rounded-lg border border-border bg-secondary/20">
                  <p className="text-sm font-semibold text-primary mb-1">{w.week}</p>
                  <p className="text-sm text-foreground leading-relaxed">{w.goal}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 9. RPRx Method */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-6 md:p-8 space-y-4">
            <h3 className="text-xl font-bold text-foreground text-center">The RPRx Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Reduce', body: 'Reduce the physical leaks that may be costing you energy, strength, mobility, confidence, or independence.' },
                { title: 'Pay', body: 'Pay with small consistent habits: movement, strength, sleep, hydration, nutrition, recovery, and prevention.' },
                { title: 'Recover', body: 'Recover the capacity to feel better, move better, lead better, serve better, and enjoy more of what you are building.' },
              ].map((step) => (
                <div key={step.title} className="p-4 rounded-lg bg-background/60 border border-border">
                  <p className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">{step.title}</p>
                  <p className="text-sm text-foreground leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 10. CTA repeat */}
        <CTASection url={bookingUrl} onEmail={handleEmail} emailing={emailing} />

        {/* Print button */}
        <div className="flex justify-center print:hidden">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print or Save as PDF
          </Button>
        </div>

        {/* 11. Disclaimer */}
        <Card className="bg-muted/40 border-muted">
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground leading-relaxed text-center">
              This assessment and report are for educational and wellness planning purposes only. They are not medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before starting a new exercise, nutrition, or wellness program, especially if you have medical conditions, symptoms, injuries, or concerns.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
