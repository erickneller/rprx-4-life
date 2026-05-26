import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useUpgradeGate } from '@/contexts/UpgradeGateContext';
import { buildPublicFunnelUrl } from '@/lib/ghlCheckoutConfig';
import { getStoredAffiliateRef } from '@/lib/affiliateStorage';
import type { PlanKey, IntervalKey } from '@/lib/ghlCheckoutConfig';

type Interval = IntervalKey;

interface Plan {
  name: string;
  key: 'free' | 'partner' | 'pro';
  monthly: number;
  yearly: number;
  description: string;
  features: string[];
  cta: string;
  ctaUrl?: string;
  highlighted: boolean;
}

interface Content {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  monthlyLabel?: string;
  yearlyLabel?: string;
  yearlyBadge?: string;
  plans?: Plan[];
}

const DEFAULTS: Content = {
  eyebrow: 'Pricing',
  heading: 'Simple, Transparent Pricing',
  subheading: "Start free. Upgrade when you're ready.",
  monthlyLabel: 'Monthly',
  yearlyLabel: 'Yearly',
  yearlyBadge: 'Save 17%',
  plans: [],
};

const Pricing = ({ content }: { content?: Content }) => {
  const c = { ...DEFAULTS, ...(content || {}) };
  const { user } = useAuth();
  const { tier } = useSubscription();
  const { requireUpgrade } = useUpgradeGate();
  const [interval, setInterval] = useState<Interval>('month');

  const plans = c.plans || [];

  const handlePaidClick = (plan: Plan) => {
    // If admin provided a custom ctaUrl, use it directly.
    if (plan.ctaUrl) {
      if (plan.ctaUrl.startsWith('/') || plan.ctaUrl.startsWith('#')) {
        window.location.href = plan.ctaUrl;
      } else {
        window.open(plan.ctaUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    if (!user) {
      const ref = getStoredAffiliateRef();
      window.location.href = buildPublicFunnelUrl(ref);
      return;
    }
    requireUpgrade({
      feature: plan.key === 'pro' ? 'virtual-advisor' : 'strategy-assistant',
      requiredTier: plan.key as PlanKey,
      interval,
    });
  };

  const formatPrice = (n: number) => {
    if (n === 0) return '$0';
    return n % 1 === 0 ? `$${n.toLocaleString()}` : `$${n.toFixed(2)}`;
  };

  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          {c.eyebrow && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              {c.eyebrow}
            </div>
          )}
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{c.heading}</h2>
          <p className="text-lg text-muted-foreground">{c.subheading}</p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-muted rounded-full p-1">
            <button
              onClick={() => setInterval('month')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${
                interval === 'month' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {c.monthlyLabel}
            </button>
            <button
              onClick={() => setInterval('year')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${
                interval === 'year' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {c.yearlyLabel} <span className="ml-1 text-accent">{c.yearlyBadge}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const amount = interval === 'month' ? plan.monthly : plan.yearly;
            const period = plan.monthly === 0 ? 'forever' : interval === 'month' ? '/month' : '/year';
            const isCurrent = user && tier === plan.key;

            return (
              <div
                key={plan.name}
                className={`relative p-8 rounded-2xl border ${
                  plan.highlighted ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-xl font-semibold mb-2 ${plan.highlighted ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${plan.highlighted ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {formatPrice(amount)}
                    </span>
                    <span className={plan.highlighted ? 'text-primary-foreground/70' : 'text-muted-foreground'}>{period}</span>
                  </div>
                  <p className={`mt-2 text-sm ${plan.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 flex-shrink-0 text-accent" />
                      <span className={plan.highlighted ? 'text-primary-foreground/90' : 'text-foreground'}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.key === 'free' ? (
                  <Link to={plan.ctaUrl || '/auth'}>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">{plan.cta}</Button>
                  </Link>
                ) : isCurrent ? (
                  <Button disabled className="w-full" variant="secondary">Current Plan</Button>
                ) : (
                  <Button
                    onClick={() => handlePaidClick(plan)}
                    className={`w-full ${
                      plan.highlighted ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
