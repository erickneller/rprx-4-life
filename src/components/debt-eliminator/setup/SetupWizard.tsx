import { useState } from "react";
import { WelcomeStep } from "./WelcomeStep";
import { GoalSelectionStep } from "./GoalSelectionStep";
import { DebtEntryStep } from "./DebtEntryStep";
import { CashFlowStep } from "./CashFlowStep";
import { DreamStep } from "./DreamStep";
import { Progress } from "@/components/ui/progress";
import {
  type DebtType,
  type DebtEntryFormData,
  type SetupWizardData,
  createEmptyDebtEntry,
} from "@/lib/debtTypes";

interface SetupWizardProps {
  onComplete: (data: SetupWizardData) => void;
  isLoading?: boolean;
  initialIncome?: number;
  initialExpenses?: number;
}

type Step = "welcome" | "goals" | "debts" | "cashflow" | "dream";

const STEPS: Step[] = ["welcome", "goals", "debts", "cashflow", "dream"];

export function SetupWizard({ 
  onComplete, 
  isLoading,
  initialIncome = 0,
  initialExpenses = 0,
}: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [selectedTypes, setSelectedTypes] = useState<DebtType[]>([]);
  const [debts, setDebts] = useState<DebtEntryFormData[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(initialIncome);
  const [monthlyExpenses, setMonthlyExpenses] = useState(initialExpenses);
  const [dreamText, setDreamText] = useState("");

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;
  const monthlySurplus = monthlyIncome - monthlyExpenses;

  const goToStep = (step: Step) => setCurrentStep(step);

  const handleGoalsComplete = () => {
    // Initialize one debt entry for each selected type
    if (debts.length === 0) {
      setDebts(selectedTypes.map((type) => createEmptyDebtEntry(type)));
    }
    goToStep("debts");
  };

  const handleComplete = () => {
    onComplete({
      selectedDebtTypes: selectedTypes,
      debts,
      dreamText,
      monthlyIncome,
      monthlyExpenses,
      monthlySurplus,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress bar - only show after welcome */}
      {currentStep !== "welcome" && (
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Step {currentStepIndex + 1} of {STEPS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>
      )}

      {/* Step content */}
      {currentStep === "welcome" && (
        <WelcomeStep onNext={() => goToStep("goals")} />
      )}

      {currentStep === "goals" && (
        <GoalSelectionStep
          selectedTypes={selectedTypes}
          onSelect={setSelectedTypes}
          onNext={handleGoalsComplete}
          onBack={() => goToStep("welcome")}
        />
      )}

      {currentStep === "debts" && (
        <DebtEntryStep
          selectedTypes={selectedTypes}
          debts={debts}
          onDebtsChange={setDebts}
          onNext={() => goToStep("cashflow")}
          onBack={() => goToStep("goals")}
        />
      )}

      {currentStep === "cashflow" && (
        <CashFlowStep
          monthlyIncome={monthlyIncome}
          monthlyExpenses={monthlyExpenses}
          onIncomeChange={setMonthlyIncome}
          onExpensesChange={setMonthlyExpenses}
          onNext={() => goToStep("dream")}
          onBack={() => goToStep("debts")}
        />
      )}

      {currentStep === "dream" && (
        <DreamStep
          dreamText={dreamText}
          onDreamChange={setDreamText}
          onComplete={handleComplete}
          onBack={() => goToStep("cashflow")}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
