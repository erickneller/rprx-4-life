import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { SetupWizard } from "@/components/debt-eliminator/setup/SetupWizard";
import { DebtDashboard } from "@/components/debt-eliminator/dashboard/DebtDashboard";
import { useDebtJourney } from "@/hooks/useDebtJourney";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

export default function DebtEliminator() {
  const {
    journey,
    debts,
    isLoading,
    hasActiveJourney,
    createJourney,
    addDebt,
    updateDebt,
    deleteDebt,
    logPayment,
    setFocusDebt,
  } = useDebtJourney();

  const { profile, isLoading: profileLoading } = useProfile();

  const handleSetupComplete = async (data: Parameters<typeof createJourney.mutate>[0]) => {
    createJourney.mutate(data);
  };

  // Pre-fill cash flow from profile if available
  const initialIncome = profile?.monthly_income ? Number(profile.monthly_income) : 0;
  const initialExpenses = profile?.monthly_living_expenses ? Number(profile.monthly_living_expenses) : 0;

  return (
    <AuthenticatedLayout>
      <div className="container py-6 px-4 md:px-6 max-w-6xl">
        {isLoading || profileLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : hasActiveJourney && journey ? (
          <DebtDashboard
            journey={journey}
            debts={debts}
            addDebt={addDebt}
            updateDebt={updateDebt}
            deleteDebt={deleteDebt}
            logPayment={logPayment}
            setFocusDebt={setFocusDebt}
          />
        ) : (
          <SetupWizard
            onComplete={handleSetupComplete}
            isLoading={createJourney.isPending}
            initialIncome={initialIncome}
            initialExpenses={initialExpenses}
          />
        )}
      </div>
    </AuthenticatedLayout>
  );
}

