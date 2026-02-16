import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/hooks/useProfile';

// ── Types ──────────────────────────────────────────────────────────

export interface TierInfo {
  name: string;
  icon: string;
  color: string;
  minScore: number;
  maxScore: number;
  nextTier: string | null;
}

export interface AwardedBadge {
  badge_id: string;
  name: string;
  icon: string;
  points: number;
  description: string;
}

export type ActivityType =
  | 'login'
  | 'assessment_complete'
  | 'deep_dive_complete'
  | 'strategy_activated'
  | 'strategy_completed'
  | 'profile_updated';

interface ScoreParams {
  profileCompleteness: number;
  assessmentsCompleted: number;
  deepDivesCompleted: number;
  strategiesActivated: number;
  strategiesCompleted: number;
  badgePointsTotal: number;
  currentStreak: number;
}

// ── Tiers ──────────────────────────────────────────────────────────

const TIERS: TierInfo[] = [
  { name: 'Awakening', icon: '🔴', color: 'red', minScore: 0, maxScore: 199, nextTier: 'Reducing' },
  { name: 'Reducing', icon: '🟠', color: 'orange', minScore: 200, maxScore: 399, nextTier: 'Paying' },
  { name: 'Paying', icon: '🟡', color: 'yellow', minScore: 400, maxScore: 599, nextTier: 'Recovering' },
  { name: 'Recovering', icon: '🟢', color: 'green', minScore: 600, maxScore: 799, nextTier: 'Thriving' },
  { name: 'Thriving', icon: '💎', color: 'purple', minScore: 800, maxScore: 1000, nextTier: null },
];

export function getTier(score: number): TierInfo {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (score >= TIERS[i].minScore) return TIERS[i];
  }
  return TIERS[0];
}

// ── Score Calculation ──────────────────────────────────────────────

export function calculateRPRxScoreV2(params: ScoreParams): { score: number; tier: TierInfo } {
  let score = 0;

  // Assessment completed: 100 pts (first one only)
  if (params.assessmentsCompleted >= 1) score += 100;

  // Profile completeness: up to 50 pts
  score += Math.round(params.profileCompleteness * 0.5);

  // Deep Dive: 75 pts (first one only)
  if (params.deepDivesCompleted >= 1) score += 75;

  // Strategies activated: 50 pts each (max 200 for first 4)
  score += Math.min(params.strategiesActivated, 4) * 50;

  // Strategies completed: 30 pts each (max 300 for first 10)
  score += Math.min(params.strategiesCompleted, 10) * 30;

  // Badge bonus points (already included in total, not added on top)
  score += params.badgePointsTotal;

  // Streak bonus: 1 pt per day, max 100
  score += Math.min(params.currentStreak, 100);

  // Cap at 1000
  score = Math.min(score, 1000);

  return { score, tier: getTier(score) };
}

// ── Profile Completeness ───────────────────────────────────────────

const PROFILE_FIELDS: (keyof Profile)[] = [
  'full_name',
  'phone',
  'monthly_income',
  'monthly_debt_payments',
  'monthly_housing',
  'monthly_insurance',
  'monthly_living_expenses',
  'profile_type',
  'financial_goals',
  'filing_status',
];

export function getProfileCompleteness(profile: Profile | null | undefined): number {
  if (!profile) return 0;
  const perField = 100 / PROFILE_FIELDS.length; // 10% each
  let complete = 0;
  for (const field of PROFILE_FIELDS) {
    const value = profile[field];
    if (value != null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
      complete += perField;
    }
  }
  return Math.round(complete);
}

// ── Streak ─────────────────────────────────────────────────────────

export async function updateStreak(userId: string): Promise<{
  currentStreak: number;
  isNewRecord: boolean;
  badgesEarned: AwardedBadge[];
}> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_streak, longest_streak, last_active_date')
    .eq('id', userId)
    .single();

  if (!profile) return { currentStreak: 0, isNewRecord: false, badgesEarned: [] };

  const today = new Date().toISOString().slice(0, 10);
  const lastActive = profile.last_active_date;

  let newStreak = profile.current_streak ?? 0;

  if (lastActive === today) {
    // Already counted today
    return { currentStreak: newStreak, isNewRecord: false, badgesEarned: [] };
  }

  if (lastActive) {
    const lastDate = new Date(lastActive);
    const todayDate = new Date(today);
    const diffMs = todayDate.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      newStreak += 1;
    } else {
      newStreak = 1; // streak broken
    }
  } else {
    newStreak = 1; // first login
  }

  const longestStreak = Math.max(profile.longest_streak ?? 0, newStreak);
  const isNewRecord = newStreak > (profile.longest_streak ?? 0);

  await supabase
    .from('profiles')
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_active_date: today,
    })
    .eq('id', userId);

  // Check streak badges
  const badgesEarned = await checkStreakBadges(userId, newStreak);

  return { currentStreak: newStreak, isNewRecord, badgesEarned };
}

async function checkStreakBadges(userId: string, currentStreak: number): Promise<AwardedBadge[]> {
  const { data: streakBadges } = await supabase
    .from('badge_definitions')
    .select('*')
    .eq('trigger_type', 'streak_reached')
    .eq('is_active', true);

  if (!streakBadges) return [];

  const { data: earnedBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const earnedIds = new Set((earnedBadges ?? []).map((b) => b.badge_id));
  const awarded: AwardedBadge[] = [];

  for (const badge of streakBadges) {
    if (earnedIds.has(badge.id)) continue;
    const triggerValue = badge.trigger_value as { streak_days?: number } | null;
    if (triggerValue?.streak_days && currentStreak >= triggerValue.streak_days) {
      const { error } = await supabase.from('user_badges').insert([{
        user_id: userId,
        badge_id: badge.id,
        points_awarded: badge.points,
      }]);
      if (!error) {
        await supabase.from('user_activity_log').insert([{
          user_id: userId,
          activity_type: 'streak_reached',
          activity_data: { badge_id: badge.id, streak_days: currentStreak } as unknown as Record<string, string>,
          points_earned: badge.points,
        }]);
        awarded.push({
          badge_id: badge.id,
          name: badge.name,
          icon: badge.icon,
          points: badge.points,
          description: badge.description,
        });
      }
    }
  }

  return awarded;
}

// ── Badge Checking ─────────────────────────────────────────────────

export async function checkAndAwardBadges(
  userId: string,
  action: ActivityType,
  context?: Record<string, unknown>
): Promise<AwardedBadge[]> {
  // Map action to trigger types to check
  const triggerTypes = getTriggerTypesForAction(action);

  const { data: badges } = await supabase
    .from('badge_definitions')
    .select('*')
    .in('trigger_type', triggerTypes)
    .eq('is_active', true);

  if (!badges || badges.length === 0) return [];

  const { data: earnedBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const earnedIds = new Set((earnedBadges ?? []).map((b) => b.badge_id));
  const awarded: AwardedBadge[] = [];

  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;

    const eligible = await checkBadgeEligibility(userId, badge, context);
    if (!eligible) continue;

    const { error } = await supabase.from('user_badges').insert([{
      user_id: userId,
      badge_id: badge.id,
      points_awarded: badge.points,
    }]);

    if (!error) {
      await supabase.from('user_activity_log').insert([{
        user_id: userId,
        activity_type: action,
        activity_data: { badge_id: badge.id, ...(context ?? {}) } as unknown as Record<string, string>,
        points_earned: badge.points,
      }]);
      awarded.push({
        badge_id: badge.id,
        name: badge.name,
        icon: badge.icon,
        points: badge.points,
        description: badge.description,
      });
    }
  }

  // Recalculate and persist score after awarding
  if (awarded.length > 0) {
    await recalculateAndPersistScore(userId);
  }

  return awarded;
}

function getTriggerTypesForAction(action: ActivityType): string[] {
  switch (action) {
    case 'assessment_complete':
      return ['assessment_complete', 'tier_reached'];
    case 'deep_dive_complete':
      return ['deep_dive_complete', 'tier_reached'];
    case 'strategy_activated':
      return ['strategy_activated', 'tier_reached'];
    case 'strategy_completed':
      return ['strategy_completed', 'tier_reached'];
    case 'profile_updated':
      return ['profile_complete', 'tier_reached'];
    case 'login':
      return ['tier_reached'];
    default:
      return [];
  }
}

async function checkBadgeEligibility(
  userId: string,
  badge: { id: string; trigger_type: string; trigger_value: unknown },
  _context?: Record<string, unknown>
): Promise<boolean> {
  const tv = badge.trigger_value as Record<string, unknown> | null;

  switch (badge.trigger_type) {
    case 'assessment_complete': {
      const { count } = await supabase
        .from('user_assessments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return (count ?? 0) >= ((tv?.count as number) ?? 1);
    }

    case 'deep_dive_complete': {
      const { count } = await supabase
        .from('user_deep_dives')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return (count ?? 0) >= ((tv?.count as number) ?? 1);
    }

    case 'strategy_activated': {
      if (tv?.all_horsemen) {
        // Check all 4 horseman types covered
        const { data } = await supabase
          .from('user_active_strategies')
          .select('strategy_id')
          .eq('user_id', userId);
        if (!data || data.length === 0) return false;
        const strategyIds = data.map((s) => s.strategy_id);
        const { data: defs } = await supabase
          .from('strategy_definitions')
          .select('horseman_type')
          .in('id', strategyIds);
        const types = new Set((defs ?? []).map((d) => d.horseman_type));
        return ['interest', 'taxes', 'insurance', 'education'].every((h) => types.has(h));
      }
      const { count } = await supabase
        .from('user_active_strategies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return (count ?? 0) >= ((tv?.count as number) ?? 1);
    }

    case 'strategy_completed': {
      const { count } = await supabase
        .from('user_active_strategies')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');
      return (count ?? 0) >= ((tv?.count as number) ?? 1);
    }

    case 'tier_reached': {
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_tier')
        .eq('id', userId)
        .single();
      const targetTier = (tv?.tier as string) ?? '';
      return profile?.current_tier === targetTier;
    }

    case 'profile_complete': {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      const completeness = getProfileCompleteness(profile as Profile | null);
      return completeness >= ((tv?.completeness as number) ?? 100);
    }

    case 'savings_milestone': {
      const { data: strategies } = await supabase
        .from('user_active_strategies')
        .select('strategy_id')
        .eq('user_id', userId);
      if (!strategies || strategies.length === 0) return false;
      const ids = strategies.map((s) => s.strategy_id);
      const { data: defs } = await supabase
        .from('strategy_definitions')
        .select('estimated_impact')
        .in('id', ids);
      let totalSavings = 0;
      for (const d of defs ?? []) {
        const match = (d.estimated_impact ?? '').match(/\$?([\d,]+)/);
        if (match) totalSavings += parseInt(match[1].replace(/,/g, ''), 10);
      }
      return totalSavings >= ((tv?.amount as number) ?? 0);
    }

    default:
      return false;
  }
}

// ── Score Persistence ──────────────────────────────────────────────

export async function recalculateAndPersistScore(userId: string): Promise<{ score: number; tier: TierInfo }> {
  // Gather all counts
  const [
    { data: profile },
    { count: assessmentCount },
    { count: deepDiveCount },
    { count: strategiesActivated },
    { count: strategiesCompleted },
    { data: badgePoints },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('user_assessments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('user_deep_dives').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('user_active_strategies').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('user_active_strategies').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
    supabase.from('user_badges').select('points_awarded').eq('user_id', userId),
  ]);

  const badgePointsTotal = (badgePoints ?? []).reduce((sum, b) => sum + b.points_awarded, 0);
  const completeness = getProfileCompleteness(profile as Profile | null);

  const { score, tier } = calculateRPRxScoreV2({
    profileCompleteness: completeness,
    assessmentsCompleted: assessmentCount ?? 0,
    deepDivesCompleted: deepDiveCount ?? 0,
    strategiesActivated: strategiesActivated ?? 0,
    strategiesCompleted: strategiesCompleted ?? 0,
    badgePointsTotal,
    currentStreak: (profile as Record<string, unknown>)?.current_streak as number ?? 0,
  });

  await supabase
    .from('profiles')
    .update({
      rprx_score: score,
      current_tier: tier.name.toLowerCase(),
      total_points_earned: score,
    })
    .eq('id', userId);

  return { score, tier };
}
