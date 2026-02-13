import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, Target, TrendingUp, DollarSign, PartyPopper } from "lucide-react";
import type { DebtJourney, UserDebt, DebtEntryFormData } from "@/lib/debtTypes";
import {
  calculateProgressPercent,
  calculateTotalPaid,
  calculateTotalRemaining,
  formatCurrency,
} from "@/lib/debtTypes";
import { getDebtRecommendation } from "@/lib/debtRecommendationEngine";
import type { CashFlowStatus } from "@/lib/cashFlowCalculator";
import { FocusDebtCard } from "./FocusDebtCard";
import { RankedDebtList } from "./RankedDebtList";
import { ChangeFocusDialog } from "./ChangeFocusDialog";
import { AddDebtDialog } from "./AddDebtDialog";
import { EditDebtDialog } from "./EditDebtDialog";
import { LogPaymentDialog } from "./LogPaymentDialog";
import { CashFlowStatusCard } from "./CashFlowStatusCard";
import { EditMotivationDialog } from "./EditMotivationDialog";
import type { UseMutationResult } from "@tanstack/react-query";

interface DebtDashboardProps {
  journey: DebtJourney;
  debts: UserDebt[];
  monthlySurplus: number | null;
  cashFlowStatus: CashFlowStatus | null;
  addDebt: UseMutationResult<UserDebt, Error, DebtEntryFormData>;
  updateDebt: UseMutationResult<UserDebt, Error, { debtId: string; updates: Partial<UserDebt> }>;
  deleteDebt: UseMutationResult<void, Error, string>;
  logPayment: UseMutationResult<{ newBalance: number; isPaidOff: boolean }, Error, { debtId: string; amount: number; note?: string }>;
  setFocusDebt: UseMutationResult<void, Error, string>;
  updateJourney: UseMutationResult<DebtJourney, Error, Partial<DebtJourney>>;
}

export function DebtDashboard({
  journey,
  debts,
  monthlySurplus,
  cashFlowStatus,
  addDebt,
  updateDebt,
  deleteDebt,
  logPayment,
  setFocusDebt,
  updateJourney,
}: DebtDashboardProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDebt, setEditingDebt] = useState<UserDebt | null>(null);
  const [paymentDebt, setPaymentDebt] = useState<UserDebt | null>(null);
  const [showChangeFocusDialog, setShowChangeFocusDialog] = useState(false);
  

  // Calculate recommendation using computed surplus from profile
  const { recommendation, rankedDebts } = useMemo(() => {
    return getDebtRecommendation(debts, monthlySurplus);
  }, [debts, monthlySurplus]);

  // Determine current focus (user override or recommendation)
  const currentFocusId = journey.focus_debt_id || recommendation?.focusDebtId;
  const focusDebt = debts.find((d) => d.id === currentFocusId);
  const isOverride = journey.focus_debt_id && journey.focus_debt_id !== recommendation?.focusDebtId;

  const progress = calculateProgressPercent(debts);
  const totalPaid = calculateTotalPaid(debts);
  const totalRemaining = calculateTotalRemaining(debts);
  const totalOriginal = debts.reduce((sum, d) => sum + d.original_balance, 0);

  const handleAddDebt = (data: DebtEntryFormData) => {
    addDebt.mutate(data, {
      onSuccess: () => setShowAddDialog(false),
    });
  };

  const handleUpdateDebt = (debtId: string, updates: Partial<UserDebt>) => {
    updateDebt.mutate({ debtId, updates }, {
      onSuccess: () => setEditingDebt(null),
    });
  };

  const handleDeleteDebt = (debtId: string) => {
    deleteDebt.mutate(debtId, {
      onSuccess: () => setEditingDebt(null),
    });
  };

  const handleLogPayment = (debtId: string, amount: number, note?: string) => {
    logPayment.mutate({ debtId, amount, note }, {
      onSuccess: () => setPaymentDebt(null),
    });
  };

  const handleChangeFocus = (debtId: string) => {
    setFocusDebt.mutate(debtId, {
      onSuccess: () => setShowChangeFocusDialog(false),
    });
  };


  // All debts paid off - celebration state
  const allPaidOff = debts.length > 0 && debts.every((d) => d.current_balance === 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Your Debt Freedom Journey
          </h1>
          <p className="text-muted-foreground">
            {allPaidOff
              ? "Congratulations! You're debt free!"
              : "Keep going! You're making progress."}
          </p>
        </div>
        <Button
          className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="h-4 w-4" />
          Add Debt
        </Button>
      </div>

      {/* Cash Flow Status Card */}
      <CashFlowStatusCard surplus={monthlySurplus} status={cashFlowStatus} />

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="h-4 w-4" />
              <span className="text-sm">Progress</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{progress}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Paid Off</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Remaining</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(totalRemaining)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <PartyPopper className="h-4 w-4" />
              <span className="text-sm">Debts</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {debts.filter((d) => d.current_balance === 0).length}/{debts.length}
              <span className="text-sm font-normal text-muted-foreground ml-1">done</span>
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Journey progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Journey Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {formatCurrency(totalPaid)} paid
              </span>
              <span className="text-muted-foreground">
                {formatCurrency(totalOriginal)} total
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Focus Debt Card */}
      {focusDebt && recommendation && !allPaidOff && (
        <FocusDebtCard
          focusDebt={focusDebt}
          recommendation={recommendation}
          isOverride={!!isOverride}
          recommendedDebt={debts.find((d) => d.id === recommendation.focusDebtId)}
          monthlySurplus={monthlySurplus}
          onLogPayment={() => setPaymentDebt(focusDebt)}
          onChangeFocus={() => setShowChangeFocusDialog(true)}
          onEdit={() => setEditingDebt(focusDebt)}
          onDelete={() => handleDeleteDebt(focusDebt.id)}
        />
      )}

      {/* Celebration state */}
      {allPaidOff && (
        <Card className="border-2 border-green-500/50 bg-green-50/30 dark:bg-green-950/20">
          <CardContent className="pt-6 text-center">
            <PartyPopper className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">
              You Did It! 🎉
            </h3>
            <p className="text-muted-foreground">
              You've paid off all your debts. Time to live your motivation!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Ranked Debt List */}
      {rankedDebts.length > 0 && !allPaidOff && (
        <RankedDebtList
          rankedDebts={rankedDebts}
          focusDebtId={currentFocusId || ""}
          onEditDebt={setEditingDebt}
          onLogPayment={setPaymentDebt}
        />
      )}

      {/* Badges section placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Badges & Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Coming soon! Earn badges as you make progress on your debt freedom
            journey.
          </p>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddDebtDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={handleAddDebt}
        isLoading={addDebt.isPending}
      />

      <EditDebtDialog
        debt={editingDebt}
        open={!!editingDebt}
        onOpenChange={(open) => !open && setEditingDebt(null)}
        onSubmit={handleUpdateDebt}
        onDelete={handleDeleteDebt}
        isLoading={updateDebt.isPending}
        isDeleting={deleteDebt.isPending}
      />

      <LogPaymentDialog
        debt={paymentDebt}
        open={!!paymentDebt}
        onOpenChange={(open) => !open && setPaymentDebt(null)}
        onSubmit={handleLogPayment}
        isLoading={logPayment.isPending}
      />

      {recommendation && (
        <ChangeFocusDialog
          open={showChangeFocusDialog}
          onOpenChange={setShowChangeFocusDialog}
          rankedDebts={rankedDebts}
          currentFocusId={currentFocusId || ""}
          recommendedFocusId={recommendation.focusDebtId}
          recommendation={recommendation}
          onConfirm={handleChangeFocus}
          isLoading={setFocusDebt.isPending}
        />
      )}

    </div>
  );
}
