import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessmentHistory } from '@/hooks/useAssessmentHistory';
import { useProfile } from '@/hooks/useProfile';
import { StartAssessmentCTA } from './StartAssessmentCTA';
import { AssessmentHistory } from './AssessmentHistory';
import { CurrentFocusCard } from './CurrentFocusCard';
import { CashFlowStatusCard } from '@/components/debt-eliminator/dashboard/CashFlowStatusCard';
import { calculateCashFlowFromNumbers } from '@/lib/cashFlowCalculator';
import { Loader2 } from 'lucide-react';

export function DashboardContent() {
  const navigate = useNavigate();
  const { data: assessments = [], isLoading } = useAssessmentHistory();
  const { profile } = useProfile();

  const isFirstTime = assessments.length === 0;

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <CurrentFocusCard />
          <CashFlowStatusCard surplus={surplus} status={status} />
          <StartAssessmentCTA isFirstTime={isFirstTime} />
          <AssessmentHistory />
        </>
      )}
    </div>
  );
}
