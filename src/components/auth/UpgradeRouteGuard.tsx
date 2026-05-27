import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
  const { user, loading: authLoading } = useAuth();
  const { tier, isLoading: subLoading } = useSubscription();
  const { requireUpgrade } = useUpgradeGate();
  const { rows, isLoading: navLoading } = useSidebarConfig();
  const location = useLocation();
  const fired = useRef(false);

  const navId = FEATURE_NAV_ITEM[feature];
  const navRow =
    rows.find(r => r.url && r.url === location.pathname) ||
    (navId ? rows.find(r => r.id === navId) : undefined) ||
    rows.find(r => r.id === feature);
  const required = navRow
    ? normalizeRequiredTier(navRow.required_tier)
    : featureRequiredTier(feature);
  const allowed = tierMeets(tier, required);

  const stillLoading = authLoading || subLoading || navLoading || !user;

  // Reset the one-shot flag whenever access flips to allowed.
  useEffect(() => {
    if (allowed) fired.current = false;
  }, [allowed]);

  useEffect(() => {
    if (stillLoading || allowed || fired.current) return;
    fired.current = true;
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[UpgradeRouteGuard] denied', {
        feature,
        route: location.pathname,
        currentTier: tier,
        requiredTier: required,
        matchedNavId: navRow?.id ?? null,
      });
    }
    requireUpgrade({ feature, requiredTier: required });
  }, [stillLoading, allowed, feature, required, requireUpgrade, tier, navRow, location.pathname]);

  // Don't redirect or gate while auth/tier/nav config is still resolving.
  if (stillLoading) return null;
  if (!allowed) return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />;

  return <Outlet />;
}
