import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Star, Flame, Loader2, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useGamification } from '@/hooks/useGamification';
import { OnboardingQuiz } from './OnboardingQuiz';
import { OnboardingReflection } from './OnboardingReflection';
import { OnboardingMilestone } from './OnboardingMilestone';
import { useDayOneCTA } from '@/hooks/useDayOneCTA';
import { OnboardingProgressBar } from './OnboardingProgressBar';
import type { QuizData } from '@/lib/onboardingEngine';

const PHASE_LABELS: Record<string, string> = {
  clarity: 'Clarity & Momentum',
  awareness: 'System Awareness',
  second_win: 'Second Win',
  identity: 'Identity Shift',
  vision: 'Future Vision',
};

const PHASE_ORDER = ['clarity', 'awareness', 'second_win', 'identity', 'vision'];

interface OnboardingCardProps {
  compact?: boolean;
}

export function OnboardingCard({ compact }: OnboardingCardProps) {
  const navigate = useNavigate();
  const dayOneCTA = useDayOneCTA();
  const { logActivity } = useGamification();
  const {
    isOnboarding, isCompleted, isLoading,
    currentDay, todayContent, completedDays,
    currentPhase, streak, totalPoints,
    isTodayCompleted, completeToday, isCompleting,
    reflections, quizAnswers,
    isLocked, nextDayNumber, nextDayTitle,
  } = useOnboarding();

  const [localCompleted, setLocalCompleted] = useState(false);

  useEffect(() => {
    setLocalCompleted(false);
  }, [currentDay]);

  if (isLoading || !isOnboarding || isCompleted || !todayContent) return null;

  const isDone = isTodayCompleted || localCompleted || isLocked;
  const phaseLabel = PHASE_LABELS[currentPhase] || currentPhase;
  const isMilestone = todayContent.content_type === 'milestone';
  const isQuiz = todayContent.content_type === 'quiz';
  const isReflection = todayContent.content_type === 'reflection';

  const handleAction = async () => {
    if (todayContent.action_type === 'navigate' && todayContent.action_target) {
      navigate(todayContent.action_target);
    }
    if (todayContent.action_type === 'scroll_to' && todayContent.action_target) {
      document.getElementById(todayContent.action_target)?.scrollIntoView({ behavior: 'smooth' });
    }
    if (todayContent.action_type === 'complete_step') {
      await completeToday();
      await logActivity('onboarding_day_complete', { day: currentDay });
      setLocalCompleted(true);
    }
  };

  const handleQuizComplete = async (answers: Record<string, string>) => {
    await completeToday(answers);
    await logActivity('onboarding_day_complete', { day: currentDay });
    setLocalCompleted(true);
  };

  const handleReflectionComplete = async (text: string) => {
    await completeToday(text);
    await logActivity('onboarding_day_complete', { day: currentDay });
    setLocalCompleted(true);
  };

  return (
    <Card className="relative overflow-hidden border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30">
      {/* Done / Locked overlay */}
      {isDone && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-3 px-6">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
          <p className="font-semibold text-green-700 dark:text-green-400">Day {currentDay} Complete!</p>

          {/* Locked teaser for next day */}
          {isLocked && nextDayNumber && nextDayNumber <= 30 && (
            <div className="mt-2 w-full max-w-sm rounded-lg border border-muted bg-card/80 p-4 text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wide">Unlocks tomorrow</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-muted-foreground shrink-0">
                  {nextDayNumber}
                </div>
                <p className="text-sm font-medium text-foreground">
                  {nextDayTitle || `Day ${nextDayNumber}`}
                </p>
              </div>
            </div>
          )}

          {/* Already at day 30 and completed */}
          {!isLocked && !nextDayNumber && (
            <p className="text-sm text-muted-foreground">Come back tomorrow for Day {Math.min(currentDay + 1, 30)}</p>
          )}
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {currentDay}
            </div>
            <div>
              <p className="font-semibold text-sm">Day {currentDay} of 30 — {phaseLabel}</p>
              <div className="flex gap-1.5 mt-1">
                {PHASE_ORDER.map((p) => (
                  <div
                    key={p}
                    className={`h-2 w-2 rounded-full ${
                      PHASE_ORDER.indexOf(p) <= PHASE_ORDER.indexOf(currentPhase)
                        ? 'bg-amber-500'
                        : 'bg-muted'
                    }`}
                    title={PHASE_LABELS[p]}
                  />
                ))}
              </div>
            </div>
          </div>
          {streak > 1 && (
            <div className="flex items-center gap-1 text-orange-500 text-sm font-medium">
              <Flame className="h-4 w-4" /> {streak}
            </div>
          )}
        </div>

        {!compact && (
          <div className="mt-2">
            <OnboardingProgressBar completedDays={completedDays} currentDay={currentDay} />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h3 className="font-bold text-base mb-2">{todayContent.title}</h3>
          {!isQuiz && (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
              <ReactMarkdown>{todayContent.body}</ReactMarkdown>
            </div>
          )}
          {isQuiz && todayContent.body && (
            <p className="text-sm text-muted-foreground mb-3">{todayContent.body}</p>
          )}
        </div>

        {/* Milestone celebration */}
        {isMilestone && !isDone && (
          <OnboardingMilestone
            dayNumber={currentDay}
            completedDays={completedDays.length}
            totalPoints={totalPoints}
            streak={streak}
          />
        )}

        {/* Quiz */}
        {isQuiz && todayContent.quiz_data && !isDone && (
          <OnboardingQuiz
            quizData={todayContent.quiz_data as QuizData}
            onComplete={handleQuizComplete}
            isSubmitting={isCompleting}
            existingAnswers={quizAnswers[String(currentDay)] as Record<string, string> | undefined}
          />
        )}

        {/* Reflection */}
        {isReflection && !isDone && (
          <OnboardingReflection
            onComplete={handleReflectionComplete}
            isSubmitting={isCompleting}
            existingReflection={reflections[String(currentDay)]}
          />
        )}

        {/* Action button for non-quiz/reflection */}
        {!isQuiz && !isReflection && !isDone && (
          <div className="flex items-center gap-3">
            {currentDay === 1 ? (
              <Button
                onClick={async () => {
                  await dayOneCTA.action();
                  if (dayOneCTA.state === 'view_leak') {
                    await completeToday();
                    setLocalCompleted(true);
                  }
                }}
                disabled={dayOneCTA.isGenerating || isCompleting}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {dayOneCTA.isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Building Your Plan…
                  </>
                ) : (
                  dayOneCTA.buttonText
                )}
              </Button>
            ) : (
              todayContent.action_text && (
                <Button
                  onClick={handleAction}
                  disabled={isCompleting}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {todayContent.action_text}
                </Button>
              )
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="gap-1 text-xs">
                <Clock className="h-3 w-3" /> ~{todayContent.estimated_minutes} min
              </Badge>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Star className="h-3 w-3" /> +{todayContent.points_reward} XP
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
