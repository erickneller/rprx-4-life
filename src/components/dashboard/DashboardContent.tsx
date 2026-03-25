import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useDebtJourney } from '@/hooks/useDebtJourney';
import { usePlans, useFocusPlan } from '@/hooks/usePlans';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { useUserCardOrder, mergeOrder } from '@/hooks/useUserCardOrder';
import { checkAndFlipOnboardingComplete } from '@/lib/onboardingCompleteCheck';
import { StartAssessmentCTA } from './StartAssessmentCTA';
import { DashboardStreakBar } from './DashboardStreakBar';
import { EditMotivationDialog } from '@/components/debt-eliminator/dashboard/EditMotivationDialog';
import { DashboardCardRenderer } from './DashboardCardRenderer';
import { useRPRxScore } from '@/hooks/useRPRxScore';
import { calculateCashFlowFromNumbers } from '@/lib/cashFlowCalculator';
import { Loader2, MessageCircle, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DailyCheckIn } from './DailyCheckIn';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export function DashboardContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: assessments = [], isLoading } = useAssessmentHistory();
  const { profile, updateProfile } = useProfile();
  const { journey, debts, hasActiveJourney } = useDebtJourney();
  const { data: plans = [] } = usePlans();
  const { data: focusPlan } = useFocusPlan();
  const { refreshScore } = useRPRxScore();
  const { cards, isLoading: cardsLoading } = useDashboardConfig();
  const { userOrder, saveOrder, resetOrder } = useUserCardOrder();
  const { enabled: chatEnabled } = useFeatureFlag('chat_enabled');
  const [showEditMotivation, setShowEditMotivation] = useState(false);

  // Merge admin config with user's custom order
  const mergedCards = useMemo(() => mergeOrder(cards, userOrder), [cards, userOrder]);

  // Background check: flip onboarding_completed if all conditions met
  useEffect(() => {
    if (user?.id && profile && !profile.onboarding_completed) {
      checkAndFlipOnboardingComplete(user.id).then((flipped) => {
        if (flipped) {
          queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
        }
      });
    }
  }, [user?.id, profile?.onboarding_completed]);

  const isFirstTime = assessments.length === 0;
  const hasNoHistory = assessments.length === 0 && plans.length === 0;

  const { surplus, status } = useMemo(() => {
    if (
      !profile ||
      profile.monthly_income == null ||
      profile.monthly_debt_payments == null ||
      profile.monthly_housing == null ||
      profile.monthly_insurance == null ||
      profile.monthly_living_expenses == null
    ) {
      return { surplus: null, status: null };
    }
    const result = calculateCashFlowFromNumbers(
      profile.monthly_income,
      profile.monthly_debt_payments,
      profile.monthly_housing,
      profile.monthly_insurance,
      profile.monthly_living_expenses
    );
    return { surplus: result.surplus, status: result.status };
  }, [profile]);

  const focusDebt = useMemo(() => {
    if (!journey?.focus_debt_id || debts.length === 0) return null;
    return debts.find((d) => d.id === journey.focus_debt_id) ?? null;
  }, [journey, debts]);

  const focusProgress = useMemo(() => {
    if (!focusDebt) return 0;
    if (focusDebt.original_balance === 0) return 100;
    const paid = focusDebt.original_balance - focusDebt.current_balance;
    return Math.round((paid / focusDebt.original_balance) * 100);
  }, [focusDebt]);

  const activeDebtFocus = !hasNoHistory && hasActiveJourney && !!focusDebt;

  const focusPlanProgress = useMemo(() => {
    if (!focusPlan) return 0;
    const total = focusPlan.content.steps?.length || 0;
    const completed = focusPlan.content.completedSteps?.length || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [focusPlan]);

  const handleSaveMotivation = (text: string, images: string[]) => {
    updateProfile.mutate({ motivation_text: text, motivation_images: images }, {
      onSuccess: () => setShowEditMotivation(false),
    });
  };

  const currentFocusProps = useMemo(() => {
    if (focusPlan) {
      return {
        focusName: focusPlan.title,
        description: `Strategy: ${focusPlan.strategy_name}`,
        progressPercent: focusPlanProgress,
        onContinue: () => navigate(`/plans/${focusPlan.id}`),
      };
    }
    if (activeDebtFocus && focusDebt) {
      return {
        focusName: focusDebt.name,
        description: `Pay down your ${focusDebt.debt_type.replace('_', ' ')} to free up monthly cash flow.`,
        progressPercent: focusProgress,
        onContinue: () => navigate('/debt-eliminator'),
      };
    }
    return null;
  }, [focusPlan, focusPlanProgress, activeDebtFocus, focusDebt, focusProgress, navigate]);

  const handleReorder = (orderedIds: string[]) => {
    saveOrder.mutate(orderedIds);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 relative">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {hasNoHistory ? (
            <>
              <DashboardStreakBar />
              <StartAssessmentCTA isFirstTime />
            </>
          ) : (
            <>
              <DashboardStreakBar />
              <DailyCheckIn />
              {cardsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {userOrder.length > 0 && (
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resetOrder.mutate()}
                        disabled={resetOrder.isPending}
                        className="text-muted-foreground"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reset layout
                      </Button>
                    </div>
                  )}
                  <DashboardCardRenderer
                    cards={mergedCards}
                    cardProps={{
                      motivation: {
                        motivation: profile?.motivation_text ?? null,
                        images: profile?.motivation_images ?? [],
                        onEdit: () => setShowEditMotivation(true),
                        onDelete: () => updateProfile.mutate({ motivation_text: null, motivation_images: [] }),
                      },
                      currentFocus: currentFocusProps,
                      cashFlow: { surplus, status },
                    }}
                    onReorder={handleReorder}
                  />
                </div>
              )}

              {!focusPlan && !activeDebtFocus && <StartAssessmentCTA isFirstTime={isFirstTime} />}
            </>
          )}

          <EditMotivationDialog
            open={showEditMotivation}
            onOpenChange={setShowEditMotivation}
            currentMotivation={profile?.motivation_text || ''}
            currentImages={profile?.motivation_images ?? []}
            onSave={handleSaveMotivation}
            isLoading={updateProfile.isPending}
          />
        </>
      )}

      {chatEnabled && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => navigate('/strategy-assistant')}
              size="icon"
              className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Chat with RPRx Assistant</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
