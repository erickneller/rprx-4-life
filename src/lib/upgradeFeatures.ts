// Single source of truth for which features require which paid tier.
// Used by UpgradeGate, LockedButton, sidebar lock affordance, and route guards.

import type { SubscriptionTier } from '@/hooks/useSubscription';

export type RequiredTier = 'partner' | 'pro';

// Feature keys — short, kebab-case, used in analytics + UI lookup.
export type FeatureKey =
  | 'strategy-assistant'
  | 'plans'
  | 'debt-eliminator'
  | 'virtual-advisor'
  | 'family-overview'
  | 'partners-directory'
  | 'library';

export const FEATURE_TIER: Record<FeatureKey, RequiredTier> = {
  'strategy-assistant': 'partner',
  'plans':              'partner',
  'debt-eliminator':    'partner',
  'partners-directory': 'partner',
  'library':            'partner',
  'virtual-advisor':    'pro',
  'family-overview':    'pro',
};

// Map sidebar nav row IDs (DB-seeded `item:*`) → feature key.
// Used by AppSidebar to intercept gated clicks.
export const NAV_ITEM_FEATURE: Record<string, FeatureKey> = {
  'item:strategy_assistant': 'strategy-assistant',
  'item:plans':              'plans',
  'item:debt_eliminator':    'debt-eliminator',
  'item:partners':           'partners-directory',
  'item:library':            'library',
  'item:virtual_advisor':    'virtual-advisor',
  'item:advisor_link':       'virtual-advisor',
};

// Map route paths → feature key (used by UpgradeRouteGuard).
export const ROUTE_FEATURE: Record<string, FeatureKey> = {
  '/strategy-assistant': 'strategy-assistant',
  '/plans':              'plans',
  '/debt-eliminator':    'debt-eliminator',
  '/partners':           'partners-directory',
  '/library':            'library',
  '/virtual-advisor':    'virtual-advisor',
};

const TIER_RANK: Record<SubscriptionTier, number> = {
  free:    0,
  partner: 1,
  paid:    1, // legacy — treat as partner-equivalent
  pro:     2,
};

export function tierMeets(current: SubscriptionTier, required: RequiredTier): boolean {
  return (TIER_RANK[current] ?? 0) >= (TIER_RANK[required] ?? 99);
}

export function featureRequiredTier(feature: FeatureKey): RequiredTier {
  return FEATURE_TIER[feature];
}
