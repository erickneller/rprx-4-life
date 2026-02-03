import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { SetupWizard } from "@/components/debt-eliminator/setup/SetupWizard";
import { DebtDashboard } from "@/components/debt-eliminator/dashboard/DebtDashboard";
import { useDebtJourney } from "@/hooks/useDebtJourney";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DebtEliminator() {
  const navigate = useNavigate();
  const {
    journey,
    debts,
    isLoading,
    hasActiveJourney,
    createJourney,
  } = useDebtJourney();

  const handleSetupComplete = async (data: Parameters<typeof createJourney.mutate>[0]) => {
    createJourney.mutate(data);
  };

  return (
    <AuthenticatedLayout>
      <div className="container py-6 px-4 md:px-6 max-w-6xl">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : hasActiveJourney && journey ? (
          <DebtDashboard journey={journey} debts={debts} />
        ) : (
          <SetupWizard
            onComplete={handleSetupComplete}
            isLoading={createJourney.isPending}
          />
        )}
      </div>
    </AuthenticatedLayout>
  );
}
