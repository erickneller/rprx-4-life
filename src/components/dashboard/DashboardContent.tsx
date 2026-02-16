import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { useProfile } from '@/hooks/useProfile';
import { useDebtJourney } from '@/hooks/useDebtJourney';
import { usePlans, useFocusPlan } from '@/hooks/usePlans';
import { StartAssessmentCTA } from './StartAssessmentCTA';
import { CurrentFocusCard } from './CurrentFocusCard';
import { CashFlowStatusCard } from '@/components/debt-eliminator/dashboard/CashFlowStatusCard';
import { MotivationCard } from '@/components/debt-eliminator/dashboard/MotivationCard';
import { EditMotivationDialog } from '@/components/debt-eliminator/dashboard/EditMotivationDialog';
import { GamificationScoreCard } from '@/components/gamification/GamificationScoreCard';
import { TierProgressBar } from '@/components/gamification/TierProgressBar';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { RecentBadges } from '@/components/gamification/RecentBadges';
import { MyStrategiesCard } from './MyStrategiesCard';
import { calculateCashFlowFromNumbers } from '@/lib/cashFlowCalculator';
import { Loader2 } from 'lucide-react';

export function DashboardContent() {
  const navigate = useNavigate();
  const { data: assessments = [], isLoading } = useAssessmentHistory();
  const { profile, updateProfile } = useProfile();
  const { journey, debts, hasActiveJourney } = useDebtJourney();
  const { data: plans = [] } = usePlans();
  const { data: focusPlan } = useFocusPlan();

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

  // Derive focus debt details from journey data
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

  // Focus plan progress
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
              {/* Motivation at the very top — drives everything */}
              <MotivationCard
                motivation={profile?.motivation_text ?? null}
                images={profile?.motivation_images ?? []}
                onEdit={() => setShowEditMotivation(true)}
                onDelete={() => updateProfile.mutate({ motivation_text: null, motivation_images: [] })}
              />

              {/* RPRx Score + Streak row */}
              <div className="grid md:grid-cols-[1fr_auto] gap-4 items-start">
                <div className="space-y-3">
                  <GamificationScoreCard />
                  <TierProgressBar />
                </div>
                <div className="flex md:flex-col gap-3 items-start">
                  <StreakCounter />
                </div>
              </div>

              {/* Plan focus takes priority */}
              {focusPlan && (
                <CurrentFocusCard
                  focusName={focusPlan.title}
                  description={`Strategy: ${focusPlan.strategy_name}`}
                  progressPercent={focusPlanProgress}
                  onContinue={() => navigate(`/plans/${focusPlan.id}`)}
                />
              )}
              {/* Debt focus as secondary */}
              {!focusPlan && activeDebtFocus && focusDebt && (
                <CurrentFocusCard
                  focusName={focusDebt.name}
                  description={`Pay down your ${focusDebt.debt_type.replace('_', ' ')} to free up monthly cash flow.`}
                  progressPercent={focusProgress}
                  onContinue={() => navigate('/debt-eliminator')}
                />
              )}
              <CashFlowStatusCard surplus={surplus} status={status} />

              {/* Active strategies */}
              <MyStrategiesCard />

              {/* Recent achievements */}
              <RecentBadges />

              {!focusPlan && !activeDebtFocus && <StartAssessmentCTA isFirstTime={isFirstTime} />}
            </>
          )}

          {/* Edit motivation dialog — always available */}
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
