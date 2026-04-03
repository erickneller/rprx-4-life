import { supabase } from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────────────────────

export interface OnboardingContent {
  id: string;
  day_number: number;
  phase: string;
  horseman_type: string;
  content_type: string;
  title: string;
  body: string;
  action_text: string | null;
  action_type: string | null;
  action_target: string | null;
  quiz_data: QuizData | null;
  points_reward: number;
  estimated_minutes: number;
  sort_order: number;
  is_active: boolean;
}

export interface QuizQuestion {
  question: string;
  options: { label: string; value: string }[];
  correct: string;
}

export interface QuizData {
  questions: QuizQuestion[];
}

export interface OnboardingProgress {
  id: string;
  user_id: string;
  onboarding_start_date: string;
  current_day: number;
  completed_days: number[];
  current_phase: string;
  streak_count: number;
  total_points_earned: number;
  quiz_answers: Record<string, unknown>;
  reflections: Record<string, string>;
  status: string;
  completed_at: string | null;
  last_completed_date: string | null;
}

export interface DayAvailability {
  currentDay: number;
  isLocked: boolean;
}

// ── Phase mapping ──────────────────────────────────────────────────

function getPhaseForDay(day: number): string {
  if (day <= 3) return 'clarity';
  if (day <= 10) return 'awareness';
  if (day <= 18) return 'second_win';
  if (day <= 25) return 'identity';
  return 'vision';
}

// ── Helpers ────────────────────────────────────────────────────────

function getLocalDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function mapContent(row: any): OnboardingContent {
  return {
    id: row.id,
    day_number: row.day_number,
    phase: row.phase,
    horseman_type: row.horseman_type,
    content_type: row.content_type,
    title: row.title,
    body: row.body,
    action_text: row.action_text,
    action_type: row.action_type,
    action_target: row.action_target,
    quiz_data: row.quiz_data as QuizData | null,
    points_reward: row.points_reward,
    estimated_minutes: row.estimated_minutes,
    sort_order: row.sort_order,
    is_active: row.is_active,
  };
}

// ── Core Functions ─────────────────────────────────────────────────

export async function getOnboardingContent(
  dayNumber: number,
  primaryHorseman: string
): Promise<OnboardingContent | null> {
  if (dayNumber < 1 || dayNumber > 30) return null;

  // Try horseman-specific first
  const { data: specific } = await (supabase as any)
    .from('onboarding_content')
    .select('*')
    .eq('day_number', dayNumber)
    .eq('horseman_type', primaryHorseman)
    .eq('is_active', true)
    .maybeSingle();

  if (specific) return mapContent(specific);

  // Fall back to universal
  const { data: universal } = await (supabase as any)
    .from('onboarding_content')
    .select('*')
    .eq('day_number', dayNumber)
    .eq('horseman_type', 'universal')
    .eq('is_active', true)
    .maybeSingle();

  return universal ? mapContent(universal) : null;
}

/**
 * Fetch just the title of a given day's content for the locked teaser.
 */
export async function getNextDayTitle(
  dayNumber: number,
  primaryHorseman: string
): Promise<string | null> {
  if (dayNumber < 1 || dayNumber > 30) return null;

  const { data: specific } = await (supabase as any)
    .from('onboarding_content')
    .select('title')
    .eq('day_number', dayNumber)
    .eq('horseman_type', primaryHorseman)
    .eq('is_active', true)
    .maybeSingle();

  if (specific) return specific.title;

  const { data: universal } = await (supabase as any)
    .from('onboarding_content')
    .select('title')
    .eq('day_number', dayNumber)
    .eq('horseman_type', 'universal')
    .eq('is_active', true)
    .maybeSingle();

  return universal?.title ?? null;
}

/**
 * Determine what day the user should see and whether it's locked.
 *
 * Rules:
 * - If no days completed → Day 1, unlocked
 * - If last_completed_date is null → treat as today (locked)
 * - If today > last_completed_date → next day unlocked
 * - If today <= last_completed_date → locked (come back tomorrow)
 */
export function getAvailableDay(
  progress: OnboardingProgress
): DayAvailability {
  const completedDays = progress.completed_days || [];

  if (completedDays.length === 0) {
    return { currentDay: 1, isLocked: false };
  }

  const lastCompleted = Math.max(...completedDays);
  const today = getLocalDateString();
  // Legacy users who completed days before last_completed_date existed
  // have null here — treat as yesterday so they can advance immediately.
  let lastDate: string;
  if (progress.last_completed_date) {
    lastDate = progress.last_completed_date;
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    lastDate = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  }

  if (lastCompleted >= 30) {
    // Journey complete
    return { currentDay: 30, isLocked: false };
  }

  if (today > lastDate) {
    // New calendar day — unlock next
    return { currentDay: lastCompleted + 1, isLocked: false };
  }

  // Same day or clock skew — locked
  return { currentDay: lastCompleted, isLocked: true };
}

// Only call this from explicit user action — never from background events, plan generation, or page load.
export async function completeDay(
  userId: string,
  dayNumber: number,
  content: OnboardingContent,
  response?: unknown
): Promise<void> {
  // Fetch current progress
  const { data: progress } = await (supabase as any)
    .from('user_onboarding_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!progress) return;

  const completedDays = [...(progress.completed_days as number[])];
  if (completedDays.includes(dayNumber)) return; // Already completed — no-op
  completedDays.push(dayNumber);

  const newPhase = getPhaseForDay(dayNumber);
  const nextDay = Math.min(dayNumber + 1, 30);
  const today = getLocalDateString();

  // Calculate streak
  const lastDate = progress.last_completed_date;
  let newStreak = progress.streak_count || 0;
  if (completedDays.length === 1) {
    newStreak = 1;
  } else if (lastDate) {
    // Check if last completion was yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    if (lastDate === yesterdayStr || lastDate === today) {
      newStreak = (progress.streak_count || 0) + 1;
    } else {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  // Build updates
  const updates: Record<string, unknown> = {
    completed_days: completedDays,
    current_day: dayNumber >= 30 ? 30 : nextDay,
    current_phase: newPhase,
    streak_count: newStreak,
    total_points_earned: (progress.total_points_earned || 0) + content.points_reward,
    last_completed_date: today,
  };

  // Save quiz answers
  if (content.content_type === 'quiz' && response) {
    const quizAnswers = { ...(progress.quiz_answers as Record<string, unknown>) };
    quizAnswers[String(dayNumber)] = response;
    updates.quiz_answers = quizAnswers;
  }

  // Save reflections
  if (content.content_type === 'reflection' && typeof response === 'string') {
    const reflections = { ...(progress.reflections as Record<string, string>) };
    reflections[String(dayNumber)] = response;
    updates.reflections = reflections;
  }

  // Day 30 completion
  if (dayNumber === 30) {
    updates.status = 'completed';
    updates.completed_at = new Date().toISOString();

    // Mark profile as onboarding completed
    await (supabase as any)
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId);
  }

  await (supabase as any)
    .from('user_onboarding_progress')
    .update(updates)
    .eq('user_id', userId);

  // Note: XP is awarded via logActivity('onboarding_day_complete') in OnboardingCard.tsx
  // to avoid double-counting and to integrate with toasts, activity log, and RPRx recalculation.

  // Check onboarding milestone badges
  await checkOnboardingBadges(userId, dayNumber, completedDays);
}

export async function startOnboarding(userId: string): Promise<void> {
  const today = getLocalDateString();

  // Upsert — skip if record already exists
  await (supabase as any)
    .from('user_onboarding_progress')
    .upsert(
      {
        user_id: userId,
        onboarding_start_date: today,
        current_day: 1,
        completed_days: [],
        current_phase: 'clarity',
        streak_count: 0,
        total_points_earned: 0,
        quiz_answers: {},
        reflections: {},
        status: 'active',
      },
      { onConflict: 'user_id', ignoreDuplicates: true }
    );
}

// ── Admin: Unlock (un-complete) a day ──────────────────────────────

export async function unlockDay(userId: string, dayNumber: number): Promise<void> {
  const { data: progress } = await (supabase as any)
    .from('user_onboarding_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!progress) return;

  const completedDays = ((progress.completed_days as number[]) || []).filter(
    (d: number) => d !== dayNumber
  );

  const updates: Record<string, unknown> = {
    completed_days: completedDays,
    current_day: dayNumber,
    current_phase: getPhaseForDay(dayNumber),
    // Reset last_completed_date to allow immediate re-completion
    last_completed_date: completedDays.length > 0
      ? progress.last_completed_date // keep as-is so lock logic works naturally
      : null,
  };

  // If we had marked the journey completed and we're unlocking day 30, revert
  if (dayNumber === 30 && progress.status === 'completed') {
    updates.status = 'active';
    updates.completed_at = null;
  }

  await (supabase as any)
    .from('user_onboarding_progress')
    .update(updates)
    .eq('user_id', userId);
}

// ── Badge checking ─────────────────────────────────────────────────

async function checkOnboardingBadges(
  userId: string,
  dayNumber: number,
  completedDays: number[]
): Promise<void> {
  const { data: badges } = await supabase
    .from('badge_definitions')
    .select('*')
    .eq('trigger_type', 'onboarding_milestone')
    .eq('is_active', true);

  if (!badges) return;

  const { data: earned } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  const earnedIds = new Set((earned || []).map(b => b.badge_id));

  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;
    const tv = badge.trigger_value as { day?: number; perfect_quiz?: boolean } | null;

    if (tv?.day && completedDays.includes(tv.day)) {
      await awardBadge(userId, badge);
    }
  }
}

async function awardBadge(
  userId: string,
  badge: { id: string; points: number; name: string }
): Promise<void> {
  const { error } = await supabase.from('user_badges').insert([{
    user_id: userId,
    badge_id: badge.id,
    points_awarded: badge.points,
  }]);

  if (!error) {
    await supabase.from('user_activity_log').insert([{
      user_id: userId,
      activity_type: 'onboarding_day_complete',
      activity_data: { badge_id: badge.id } as unknown as Record<string, string>,
      points_earned: badge.points,
    }]);
  }
}
