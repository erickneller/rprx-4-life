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
}

// ── Phase mapping ──────────────────────────────────────────────────

function getPhaseForDay(day: number): string {
  if (day <= 3) return 'clarity';
  if (day <= 10) return 'awareness';
  if (day <= 18) return 'second_win';
  if (day <= 25) return 'identity';
  return 'vision';
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
  if (!completedDays.includes(dayNumber)) {
    completedDays.push(dayNumber);
  }

  const newPhase = getPhaseForDay(dayNumber);
  const nextDay = Math.min(dayNumber + 1, 30);

  // Calculate streak
  const today = new Date().toISOString().slice(0, 10);
  const startDate = new Date(progress.onboarding_start_date);
  const todayDate = new Date(today);
  const daysSinceStart = Math.floor((todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Streak: if yesterday's day was also completed or this is the first day
  let newStreak = progress.streak_count || 0;
  if (completedDays.length === 1) {
    newStreak = 1;
  } else {
    // Check if last completion was yesterday or today
    const prevDay = dayNumber - 1;
    if (completedDays.includes(prevDay) || daysSinceStart <= completedDays.length) {
      newStreak = (progress.streak_count || 0) + 1;
    } else {
      newStreak = 1;
    }
  }

  // Build updates
  const updates: Record<string, unknown> = {
    completed_days: completedDays,
    current_day: dayNumber >= 30 ? 30 : nextDay,
    current_phase: newPhase,
    streak_count: newStreak,
    total_points_earned: (progress.total_points_earned || 0) + content.points_reward,
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

  // Award points to profiles.total_points_earned (direct update)
  const { data: profileData } = await supabase
    .from('profiles')
    .select('total_points_earned')
    .eq('id', userId)
    .single();

  if (profileData) {
    await supabase
      .from('profiles')
      .update({ total_points_earned: (profileData.total_points_earned || 0) + content.points_reward })
      .eq('id', userId);
  }

  // Check onboarding milestone badges
  await checkOnboardingBadges(userId, dayNumber, completedDays);
}

export function getAvailableDay(
  progress: OnboardingProgress
): number {
  const completedDays = progress.completed_days || [];
  const startDate = new Date(progress.onboarding_start_date);
  const today = new Date(new Date().toISOString().slice(0, 10));
  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const maxAccessibleDay = Math.min(daysSinceStart, 30);

  // Find lowest uncompleted day up to maxAccessibleDay
  for (let d = 1; d <= maxAccessibleDay; d++) {
    if (!completedDays.includes(d)) return d;
  }

  // All accessible days completed — return next day if available
  return Math.min(maxAccessibleDay + 1, 30);
}

export async function startOnboarding(userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

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

// ── Helpers ────────────────────────────────────────────────────────

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
