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

  // DB-driven tier wins. Find the sidebar row by:
  //  1) current route URL (most reliable — e.g. '/library')
  //  2) known feature → nav id alias (e.g. 'item:library')
  //  3) bare feature name as id (legacy seed used id='library')
  const navId = FEATURE_NAV_ITEM[feature];
  const navRow =
    rows.find(r => r.url && r.url === location.pathname) ||
    (navId ? rows.find(r => r.id === navId) : undefined) ||
    rows.find(r => r.id === feature);
  const required = navRow
    ? normalizeRequiredTier(navRow.required_tier)
    : featureRequiredTier(feature);
  const allowed = tierMeets(tier, required);

  // Reset the one-shot flag whenever access flips to allowed (tier finally loaded).
  useEffect(() => {
    if (allowed) fired.current = false;
  }, [allowed]);

  useEffect(() => {
    if (isLoading || navLoading || allowed || fired.current) return;
    fired.current = true;
    requireUpgrade({ feature, requiredTier: required });
  }, [isLoading, navLoading, allowed, feature, required, requireUpgrade]);

  // Don't redirect or gate while the user's tier is still resolving.
  if (isLoading || navLoading) return null;
  if (!allowed) return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />;



  return <Outlet />;
}
