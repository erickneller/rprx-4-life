import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useMoneyLeak } from '@/hooks/useMoneyLeak';
import { DollarSign, ArrowRight, TrendingUp, CheckCircle2, ClipboardList } from 'lucide-react';

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const HORSEMAN_COLORS: Record<string, string> = {
  interest: 'bg-blue-500',
  taxes: 'bg-emerald-500',
  insurance: 'bg-purple-500',
  education: 'bg-amber-500',
};

const HORSEMAN_LABELS: Record<string, string> = {
  interest: 'Interest',
  taxes: 'Taxes',
  insurance: 'Insurance',
  education: 'Education',
};

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

interface MoneyLeakCardProps {
  compact?: boolean;
}

export function MoneyLeakCard({ compact = false }: MoneyLeakCardProps) {
  const navigate = useNavigate();
  const { result, focusedPlan, isLoading } = useMoneyLeak();

  const lowAnimated = useCountUp(result?.totalLeakLow ?? 0);
  const highAnimated = useCountUp(result?.totalLeakHigh ?? 0);
  const recoveredAnimated = useCountUp(result?.totalRecovered ?? 0);

  if (isLoading) return null;

  // Teaser state — no plans
  if (!result) {
    return (
      <Card id="money-leak-card" className="gradient-hero text-primary-foreground border-0 overflow-hidden">
        <CardContent className="p-6 text-center space-y-3">
          <DollarSign className="h-10 w-10 mx-auto opacity-80" />
          <p className="text-lg font-semibold">
            Discover your hidden financial opportunities
          </p>
          <p className="text-sm opacity-80">
            Complete your assessment to see how much money you may be leaving on the table.
          </p>
          <Button
            variant="secondary"
            onClick={() => navigate('/assessment')}
            className="mt-2"
          >
            Take Your Assessment <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="gradient-hero text-primary-foreground border-0">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 opacity-80" />
            <span className="text-sm font-medium opacity-80">Money on the table</span>
          </div>
          <p className="text-xl font-bold">
            {fmt.format(lowAnimated)} – {fmt.format(highAnimated)}/yr
          </p>
          {result.percentRecovered > 0 && (
            <p className="text-xs opacity-80">
              ✅ {result.percentRecovered}% recovered
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Calculate horseman bar segments
  const totalHigh = result.totalLeakHigh || 1;
  const horsemen = (['interest', 'taxes', 'insurance', 'education'] as const).filter(
    h => result.leakByHorseman[h].high > 0
  );

  return (
    <Card id="money-leak-card" className="gradient-hero text-primary-foreground border-0 overflow-hidden">
      <CardContent className="p-6 md:p-8 space-y-6">
        {/* Headline */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium opacity-80">
            <TrendingUp className="h-4 w-4" />
            Money Leak Estimator
          </div>
          <p className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
            💸 You may be leaving{' '}
            <span className="text-amber-300">{fmt.format(lowAnimated)}</span>
            {' – '}
            <span className="text-amber-300">{fmt.format(highAnimated)}</span>
            {' '}per year on the table
          </p>
        </div>

        {/* Horseman breakdown bar */}
        {horsemen.length > 0 && (
          <div className="space-y-3">
            <div className="h-4 rounded-full overflow-hidden flex">
              {horsemen.map(h => {
                const pct = (result.leakByHorseman[h].high / totalHigh) * 100;
                return (
                  <div
                    key={h}
                    className={`${HORSEMAN_COLORS[h]} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {horsemen.map(h => (
                <div key={h} className="flex items-center gap-1.5">
                  <div className={`h-2.5 w-2.5 rounded-full ${HORSEMAN_COLORS[h]}`} />
                  <span className="opacity-80">{HORSEMAN_LABELS[h]}</span>
                  <span className="font-medium">{fmt.format(Math.round(result.leakByHorseman[h].high))}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recovery progress */}
        {result.totalRecovered > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {fmt.format(recoveredAnimated)} recovered so far
              </span>
              <span className="font-medium">{result.percentRecovered}%</span>
            </div>
            <Progress value={result.percentRecovered} className="h-2 bg-white/20 [&>div]:bg-emerald-400" />
          </div>
        ) : (
          <p className="text-sm opacity-70">
            Start your first plan to begin recovering →
          </p>
        )}

        {/* Focused plan progress */}
        {focusedPlan && result.focusedPlanProgress > 0 && result.focusedPlanProgress < 100 && (
          <div className="text-sm opacity-80 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Current plan: {focusedPlan.title} — {result.focusedPlanProgress}% complete
          </div>
        )}

        {/* CTA */}
        <div>
          {focusedPlan ? (
            <Button
              variant="secondary"
              onClick={() => navigate(`/plans/${focusedPlan.id}`)}
            >
              Continue Your Plan <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={() => navigate('/plans')}
            >
              Set Your Focus Plan <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
