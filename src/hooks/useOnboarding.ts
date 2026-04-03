import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  getOnboardingContent,
  getNextDayTitle,
  getAvailableDay,
  startOnboarding,
  completeDay,
  unlockDay,
  type OnboardingContent,
  type OnboardingProgress,
} from '@/lib/onboardingEngine';
import { useEffect } from 'react';

export function useOnboarding(previewDay?: number | null) {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Fetch progress record
  const { data: progress, isLoading: progressLoading } = useQuery({
    queryKey: ['onboarding-progress', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await (supabase as any)
        .from('user_onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!data) return null;
      return {
        ...data,
        completed_days: (data.completed_days || []) as number[],
        quiz_answers: (data.quiz_answers || {}) as Record<string, unknown>,
        reflections: (data.reflections || {}) as Record<string, string>,
        last_completed_date: data.last_completed_date as string | null,
      } as OnboardingProgress;
    },
    enabled: !!user,
  });

  // Get primary horseman from latest assessment
  const { data: primaryHorseman } = useQuery({
    queryKey: ['primary-horseman', user?.id],
    queryFn: async () => {
      if (!user) return 'universal';
      const { data } = await supabase
        .from('user_assessments')
        .select('primary_horseman')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.primary_horseman || 'universal';
    },
    enabled: !!user,
  });

  // Auto-start: if user has an assessment but no onboarding record
  const { data: hasAssessment } = useQuery({
    queryKey: ['has-assessment', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { count } = await supabase
        .from('user_assessments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      return (count || 0) > 0;
    },
    enabled: !!user && !progressLoading && !progress,
  });

  useEffect(() => {
    if (user && hasAssessment && !progress && !progressLoading) {
      startOnboarding(user.id).then(() => {
        qc.invalidateQueries({ queryKey: ['onboarding-progress'] });
      });
    }
  }, [user, hasAssessment, progress, progressLoading, qc]);

  // Compute available day with lock status
  const dayAvailability = progress && progress.status === 'active'
    ? getAvailableDay(progress)
    : null;

  const availableDay = dayAvailability?.currentDay ?? null;
  const isLocked = dayAvailability?.isLocked ?? false;

  const contentDay = previewDay ?? availableDay;

  // Fetch content for the active day (or admin preview day)
  const { data: todayContent } = useQuery({
    queryKey: ['onboarding-content', contentDay, primaryHorseman],
    queryFn: () => getOnboardingContent(contentDay!, primaryHorseman || 'universal'),
    enabled: !!contentDay && !!primaryHorseman,
  });

  // Fetch next day title when locked (for teaser)
  const nextDayNumber = isLocked && availableDay ? Math.min(availableDay + 1, 30) : null;
  const { data: nextDayTitle } = useQuery({
    queryKey: ['onboarding-next-title', nextDayNumber, primaryHorseman],
    queryFn: () => getNextDayTitle(nextDayNumber!, primaryHorseman || 'universal'),
    enabled: !!nextDayNumber && !!primaryHorseman,
  });

  // Check if today is already completed
  const isTodayCompleted = progress && availableDay
    ? progress.completed_days.includes(availableDay)
    : false;

  // Complete today mutation
  const completeMutation = useMutation({
    mutationFn: async (response?: unknown) => {
      if (!user || !availableDay || !todayContent) throw new Error('No content');
      if (progress?.completed_days.includes(availableDay)) return;
      await completeDay(user.id, availableDay, todayContent, response);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-progress'] });
      qc.invalidateQueries({ queryKey: ['onboarding-content'] });
      qc.invalidateQueries({ queryKey: ['onboarding-next-title'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['user-badges'] });
    },
  });

  // Admin: unlock (un-complete) a specific day
  const unlockMutation = useMutation({
    mutationFn: async (day: number) => {
      if (!user) throw new Error('No user');
      await unlockDay(user.id, day);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-progress'] });
      qc.invalidateQueries({ queryKey: ['onboarding-content'] });
      qc.invalidateQueries({ queryKey: ['onboarding-next-title'] });
    },
  });

  const isOnboarding = !!progress && progress.status === 'active';
  const isCompleted = !!progress && progress.status === 'completed';
  const completedDays = progress?.completed_days || [];
  const progressPercent = Math.round((completedDays.length / 30) * 100);

  return {
    isOnboarding,
    isCompleted,
    isLoading: progressLoading,
    currentDay: availableDay || 1,
    todayContent: todayContent || null,
    completedDays,
    currentPhase: progress?.current_phase || 'clarity',
    streak: progress?.streak_count || 0,
    totalPoints: progress?.total_points_earned || 0,
    progress: progressPercent,
    isTodayCompleted,
    isLocked,
    nextDayNumber,
    nextDayTitle: nextDayTitle || null,
    completeToday: (response?: unknown) => completeMutation.mutateAsync(response),
    isCompleting: completeMutation.isPending,
    reflections: progress?.reflections || {},
    quizAnswers: progress?.quiz_answers || {},
  };
}
