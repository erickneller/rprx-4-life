import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Stripe Price IDs — set these in src/lib/stripeConfig.ts after creating prices in Stripe.
import { STRIPE_PRICES } from '@/lib/stripeConfig';

type Interval = 'month' | 'year';

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interval, setInterval] = useState<Interval>('month');
  const [loadingPrice, setLoadingPrice] = useState<string | null>(null);

  const plans = [
    {
      name: 'Free',
      monthly: 0,
      yearly: 0,
      priceId: { month: null, year: null },
      description: 'Get started with financial awareness.',
      features: [
        'Financial Success Assessment',
        'Four Horsemen Visualization',
        'Cash Flow Snapshot',
        'Diagnostic Feedback',
        'Saved Results & History',
      ],
      cta: 'Get Started Free',
      highlighted: false,
    },
    {
      name: 'Partner',
      monthly: 49.97,
      yearly: 497,
      priceId: { month: STRIPE_PRICES.partner.month, year: STRIPE_PRICES.partner.year },
      description: 'Personalized strategies and deeper insight.',
      features: [
        'Everything in Free',
        'AI Strategy Assistant',
        'Personalized Implementation Plans',
        'Progress Tracking Dashboard',
        'Priority Recommendations',
        'Priority Email Support',
      ],
      cta: 'Start Partner',
      highlighted: true,
    },
    {
      name: 'Pro',
      monthly: 997,
      yearly: 9997,
      priceId: { month: STRIPE_PRICES.pro.month, year: STRIPE_PRICES.pro.year },
      description: 'Full advisor coordination and unlimited access.',
      features: [
        'Everything in Partner',
        'Unlimited AI Strategy Sessions',
        'Advisor Collaboration Tools',
        'CPA-Led Advisor Sessions',
        'Family Financial Overview',
        'Dedicated Support',
      ],
      cta: 'Start Pro',
      highlighted: false,
    },
  ];

  const handleCheckout = async (priceId: string | null, planName: string) => {
    if (!priceId) {
      navigate('/auth');
      return;
    }
    if (!user) {
      navigate('/auth?redirect=pricing');
      return;
    }
    setLoadingPrice(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || `Couldn't start ${planName} checkout`);
      setLoadingPrice(null);
    }
  };

  const formatPrice = (n: number) => {
    if (n === 0) return '$0';
    return n % 1 === 0 ? `$${n.toLocaleString()}` : `$${n.toFixed(2)}`;
  };

  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Pricing
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free. Upgrade when you're ready.
          </p>
        </div>

        {/* Interval toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-muted rounded-full p-1">
            <button
              onClick={() => setInterval('month')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${
                interval === 'month' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('year')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${
                interval === 'year' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Yearly <span className="ml-1 text-accent">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const amount = interval === 'month' ? plan.monthly : plan.yearly;
            const priceId = interval === 'month' ? plan.priceId.month : plan.priceId.year;
            const isLoading = loadingPrice === priceId;
            const period = plan.monthly === 0 ? 'forever' : interval === 'month' ? '/month' : '/year';

            return (
              <div
                key={plan.name}
                className={`relative p-8 rounded-2xl border ${
                  plan.highlighted
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-xl font-semibold mb-2 ${
                    plan.highlighted ? 'text-primary-foreground' : 'text-foreground'
                  }`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${
                      plan.highlighted ? 'text-primary-foreground' : 'text-foreground'
                    }`}>
                      {formatPrice(amount)}
                    </span>
                    <span className={plan.highlighted ? 'text-primary-foreground/70' : 'text-muted-foreground'}>
                      {period}
                    </span>
                  </div>
                  <p className={`mt-2 text-sm ${
                    plan.highlighted ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  }`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 flex-shrink-0 text-accent" />
                      <span className={plan.highlighted ? 'text-primary-foreground/90' : 'text-foreground'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.monthly === 0 ? (
                  <Link to="/auth">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                      {plan.cta}
                    </Button>
                  </Link>
                ) : (
                  <Button
                    onClick={() => handleCheckout(priceId, plan.name)}
                    disabled={isLoading || !priceId}
                    className={`w-full ${
                      plan.highlighted
                        ? 'bg-accent hover:bg-accent/90 text-accent-foreground'
                        : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    }`}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : plan.cta}
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
