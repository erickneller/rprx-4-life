import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { useProfile } from '@/hooks/useProfile';
import { useDebtJourney } from '@/hooks/useDebtJourney';
import { usePlans, useFocusPlan } from '@/hooks/usePlans';
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { StartAssessmentCTA } from './StartAssessmentCTA';
import { EditMotivationDialog } from '@/components/debt-eliminator/dashboard/EditMotivationDialog';
import { DashboardCardRenderer } from './DashboardCardRenderer';
import { useRPRxScore } from '@/hooks/useRPRxScore';
import { calculateCashFlowFromNumbers } from '@/lib/cashFlowCalculator';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardContent() {
  const navigate = useNavigate();
  const { data: assessments = [], isLoading } = useAssessmentHistory();
  const { profile, updateProfile } = useProfile();
  const { journey, debts, hasActiveJourney } = useDebtJourney();
  const { data: plans = [] } = usePlans();
  const { data: focusPlan } = useFocusPlan();
  const { refreshScore } = useRPRxScore();
  const { cards, isLoading: cardsLoading } = useDashboardConfig();

  const [showEditMotivation, setShowEditMotivation] = useState(false);

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

  // Build current focus props
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {hasNoHistory ? (
            <StartAssessmentCTA isFirstTime />
          ) : (
            <>
              {cardsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
                </div>
              ) : (
                <DashboardCardRenderer
                  cards={cards}
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
                />
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
    </div>
  );
}
