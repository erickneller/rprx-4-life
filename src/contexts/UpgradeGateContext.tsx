import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import { useSubscription } from '@/hooks/useSubscription';
import {
  featureRequiredTier,
  tierMeets,
  type FeatureKey,
  type RequiredTier,
} from '@/lib/upgradeFeatures';
import type { IntervalKey, PlanKey } from '@/lib/ghlCheckoutConfig';

interface RequireUpgradeArgs {
  /** Optional analytics/registry feature key. Used as fallback for requiredTier when provided. */
  feature?: FeatureKey | string;
  /** Overrides the registry default. */
  requiredTier?: RequiredTier;
  interval?: IntervalKey;
}

interface UpgradeGateContextValue {
  requireUpgrade: (args: RequireUpgradeArgs) => void;
  /** Returns true when the user does NOT yet meet the required tier for the feature. */
  isLocked: (feature: FeatureKey) => boolean;
  /** Direct tier check by required tier. */
  tierLocked: (required: RequiredTier) => boolean;
}

const UpgradeGateContext = createContext<UpgradeGateContextValue | null>(null);

export function UpgradeGateProvider({ children }: { children: ReactNode }) {
  const { tier } = useSubscription();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<PlanKey>('partner');
  const [interval, setInterval] = useState<IntervalKey>('month');

  const requireUpgrade = useCallback(
    ({ feature, requiredTier, interval: ivl }: RequireUpgradeArgs) => {
      let need: RequiredTier =
        requiredTier ??
        (feature && (feature as FeatureKey) in FEATURE_TIER
          ? featureRequiredTier(feature as FeatureKey)
          : 'partner');
      if (need === 'free') return; // nothing to gate
      setPlan(need === 'pro' ? 'pro' : 'partner');
      if (ivl) setInterval(ivl);
      setOpen(true);
    },
    [],
  );

  const isLocked = useCallback(
    (feature: FeatureKey) => !tierMeets(tier, featureRequiredTier(feature)),
    [tier],
  );

  const tierLocked = useCallback(
    (required: RequiredTier) => !tierMeets(tier, required),
    [tier],
  );

  const value = useMemo<UpgradeGateContextValue>(
    () => ({ requireUpgrade, isLocked, tierLocked }),
    [requireUpgrade, isLocked, tierLocked],
  );

  return (
    <UpgradeGateContext.Provider value={value}>
      {children}
      <UpgradeModal
        open={open}
        onOpenChange={setOpen}
        initialPlan={plan}
        initialInterval={interval}
      />
    </UpgradeGateContext.Provider>
  );
}

export function useUpgradeGate(): UpgradeGateContextValue {
  const ctx = useContext(UpgradeGateContext);
  if (!ctx) {
    // Soft fallback so components used outside the provider don't crash.
    return {
      requireUpgrade: () => {
        if (typeof window !== 'undefined') window.location.href = '/#pricing';
      },
      isLocked: () => false,
      tierLocked: () => false,
    };
  }
  return ctx;
}
