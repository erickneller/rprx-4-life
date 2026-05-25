import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useUpgradeGate } from '@/contexts/UpgradeGateContext';
import { featureRequiredTier, tierMeets, type FeatureKey } from '@/lib/upgradeFeatures';

interface UpgradeRouteGuardProps {
  feature: FeatureKey;
}

/**
 * Wraps a paid route. If the user lacks the required tier:
 *  - Opens the global upgrade modal once on mount.
 *  - Redirects to /dashboard so the user isn't stranded on a locked page.
 */
export function UpgradeRouteGuard({ feature }: UpgradeRouteGuardProps) {
  const { tier, isLoading } = useSubscription();
  const { requireUpgrade } = useUpgradeGate();
  const location = useLocation();
  const fired = useRef(false);

  const required = featureRequiredTier(feature);
  const allowed = tierMeets(tier, required);

  useEffect(() => {
    if (isLoading || allowed || fired.current) return;
    fired.current = true;
    requireUpgrade({ feature });
  }, [isLoading, allowed, feature, requireUpgrade]);

  if (isLoading) return null;
  if (!allowed) return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />;

  return <Outlet />;
}
