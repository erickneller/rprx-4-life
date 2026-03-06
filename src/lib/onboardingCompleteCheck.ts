import { supabase } from '@/integrations/supabase/client';

/**
 * Checks whether the user has met all onboarding completion criteria
 * and flips profiles.onboarding_completed to true if so.
 *
 * Conditions (ALL must be true):
 * 1. user_assessments row with completed_at IS NOT NULL
 * 2. saved_plans row with is_focus = true
 * 3. user_onboarding_progress.current_day >= 2
 *
 * Returns true if the flag was flipped in this call.
 */
export async function checkAndFlipOnboardingComplete(userId: string): Promise<boolean> {
  // 1. Assessment completed
  const { data: assessment } = await supabase
    .from('user_assessments')
    .select('completed_at')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .limit(1)
    .maybeSingle();
  if (!assessment) return false;

  // 2. Focus plan exists
  const { data: plan } = await supabase
    .from('saved_plans')
    .select('id')
    .eq('user_id', userId)
    .eq('is_focus', true)
    .limit(1)
    .maybeSingle();
  if (!plan) return false;

  // 3. Onboarding progress past Day 1
  const { data: progress } = await supabase
    .from('user_onboarding_progress')
    .select('current_day')
    .eq('user_id', userId)
    .maybeSingle();
  if (!progress || progress.current_day < 2) return false;

  // All conditions met — flip the flag
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', userId);

  return !error;
}
