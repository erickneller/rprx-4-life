import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, Sparkles, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export function BillingCard() {
  const { tier, isFree, isLoading } = useSubscription();
  const { user } = useAuth();
  const [opening, setOpening] = useState(false);
  const [source, setSource] = useState<'stripe' | 'ghl' | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase
        .from('user_subscriptions') as any)
        .select('source')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.source) setSource(data.source);
    })();
  }, [user]);

  const openPortal = async () => {
    setOpening(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast.error(err?.message || 'Could not open billing portal');
      setOpening(false);
    }
  };

  const tierLabel = tier === 'pro' ? 'Pro' : tier === 'partner' ? 'Partner' : tier === 'paid' ? 'Paid' : 'Free';
  const isGhl = !isFree && source === 'ghl';

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Billing & Subscription
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your RPRx plan, payment method, and invoices.
          </p>
        </div>
        <Badge variant={isFree ? 'secondary' : 'default'} className="capitalize">
          {tierLabel}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-3">
        {isFree ? (
          <Link to="/#pricing">
            <Button>Upgrade Plan</Button>
          </Link>
        ) : isGhl ? (
          <>
            <a href="mailto:support@rprx4life.com?subject=Subscription%20change%20request">
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Manage via Support
              </Button>
            </a>
            <p className="text-xs text-muted-foreground w-full">
              Your subscription was purchased through an external checkout. Email{' '}
              <a href="mailto:support@rprx4life.com" className="underline">support@rprx4life.com</a>{' '}
              to update payment, change plan, or cancel.
            </p>
          </>
        ) : (
          <Button onClick={openPortal} disabled={opening || isLoading}>
            {opening ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
            Manage Subscription
          </Button>
        )}
      </div>
    </Card>
  );
}
