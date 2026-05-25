import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSubscription } from '@/hooks/useSubscription';
import { useUpgradeGate } from '@/contexts/UpgradeGateContext';
import {
  FEATURE_NAV_ITEM,
  featureRequiredTier,
  normalizeRequiredTier,
  tierMeets,
  type FeatureKey,
} from '@/lib/upgradeFeatures';
import { useSidebarConfig } from '@/hooks/useSidebarConfig';

interface UpgradeRouteGuardProps {
  feature: FeatureKey;
}

/**
 * Wraps a paid route. DB-driven `required_tier` from sidebar_nav_config wins
 * over the hardcoded FEATURE_TIER map, so admin "Free" actually unlocks the page.
 */
export function UpgradeRouteGuard({ feature }: UpgradeRouteGuardProps) {
  const { tier, isLoading } = useSubscription();
  const { requireUpgrade } = useUpgradeGate();
  const { rows, isLoading: navLoading } = useSidebarConfig();
  const location = useLocation();
  const fired = useRef(false);

  const navId = FEATURE_NAV_ITEM[feature];
  const navRow = navId ? rows.find(r => r.id === navId) : undefined;
  const required = navRow
    ? normalizeRequiredTier(navRow.required_tier)
    : featureRequiredTier(feature);
  const allowed = tierMeets(tier, required);

  useEffect(() => {
    if (isLoading || navLoading || allowed || fired.current) return;
    fired.current = true;
    requireUpgrade({ feature, requiredTier: required });
  }, [isLoading, navLoading, allowed, feature, required, requireUpgrade]);

  if (isLoading || navLoading) return null;
  if (!allowed) return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />;

  return <Outlet />;
}
