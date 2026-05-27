import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { buildCheckoutUrl, type PlanKey, type IntervalKey } from '@/lib/ghlCheckoutConfig';
import { getStoredAffiliateRef } from '@/lib/affiliateStorage';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPlan?: PlanKey;
  initialInterval?: IntervalKey;
}

export function UpgradeModal({ open, onOpenChange, initialPlan = 'partner', initialInterval = 'month' }: UpgradeModalProps) {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const qc = useQueryClient();
  const [plan, setPlan] = useState<PlanKey>(initialPlan);
  const [interval, setInterval] = useState<IntervalKey>(initialInterval);
  const [iframeLoading, setIframeLoading] = useState(true);
  const startingTier = tier;

  useEffect(() => { setIframeLoading(true); }, [plan, interval]);

  // Poll for subscription tier change while open
  useEffect(() => {
    if (!open || !user) return;
    const id = window.setInterval(async () => {
      await qc.invalidateQueries({ queryKey: ['subscription-tier', 'v2', user.id] });
      const next = qc.getQueryData<string>(['subscription-tier', 'v2', user.id]);

      if (next && next !== 'free' && next !== startingTier) {
        toast.success(`Welcome to RPRx ${next === 'pro' ? 'Pro' : 'Partner'}!`);
        onOpenChange(false);
      }
    }, 3000);
    return () => window.clearInterval(id);
  }, [open, user, qc, startingTier, onOpenChange]);

  const checkoutUrl = buildCheckoutUrl(plan, interval, {
    email: user?.email,
    userId: user?.id,
    ref: getStoredAffiliateRef(),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-3 border-b">
          <DialogTitle>Upgrade your plan</DialogTitle>
          <DialogDescription>
            Secure checkout powered by GoHighLevel. You'll stay logged in here — your access updates automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-4 pb-3 border-b flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Tabs value={plan} onValueChange={(v) => setPlan(v as PlanKey)}>
            <TabsList>
              <TabsTrigger value="partner">Partner</TabsTrigger>
              <TabsTrigger value="pro">Pro</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={interval} onValueChange={(v) => setInterval(v as IntervalKey)}>
            <TabsList>
              <TabsTrigger value="month">Monthly</TabsTrigger>
              <TabsTrigger value="year">Yearly <span className="ml-1 text-xs text-accent">−17%</span></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 relative bg-muted/30">
          {checkoutUrl.includes('REPLACE_') ? (
            <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
              <div className="max-w-md space-y-2">
                <p className="font-medium">Checkout link not configured yet</p>
                <p className="text-sm text-muted-foreground">
                  An admin needs to add the live GoHighLevel checkout URL for
                  the <strong>{plan}</strong> ({interval}) plan before this can be completed.
                </p>
              </div>
            </div>
          ) : (
            <>
              {iframeLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <iframe
                key={checkoutUrl}
                src={checkoutUrl}
                title="Checkout"
                className="w-full h-full border-0"
                onLoad={() => setIframeLoading(false)}
                allow="payment"
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
