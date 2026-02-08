import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, DollarSign, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CashFlowStepProps {
  monthlyIncome: number;
  monthlyExpenses: number;
  onIncomeChange: (value: number) => void;
  onExpensesChange: (value: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function CashFlowStep({
  monthlyIncome,
  monthlyExpenses,
  onIncomeChange,
  onExpensesChange,
  onNext,
  onBack,
}: CashFlowStepProps) {
  const [incomeInput, setIncomeInput] = useState(
    monthlyIncome > 0 ? monthlyIncome.toString() : ""
  );
  const [expensesInput, setExpensesInput] = useState(
    monthlyExpenses > 0 ? monthlyExpenses.toString() : ""
  );

  const surplus = monthlyIncome - monthlyExpenses;
  const hasValidIncome = monthlyIncome > 0;
  const hasValidExpenses = monthlyExpenses > 0;
  const canProceed = hasValidIncome && hasValidExpenses;

  // Parse and update parent state
  const handleIncomeChange = (value: string) => {
    setIncomeInput(value);
    const parsed = parseFloat(value.replace(/[^0-9.]/g, ""));
    onIncomeChange(isNaN(parsed) ? 0 : parsed);
  };

  const handleExpensesChange = (value: string) => {
    setExpensesInput(value);
    const parsed = parseFloat(value.replace(/[^0-9.]/g, ""));
    onExpensesChange(isNaN(parsed) ? 0 : parsed);
  };

  // Format for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getSurplusIcon = () => {
    if (surplus > 0) return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (surplus < 0) return <TrendingDown className="h-5 w-5 text-red-500" />;
    return <Minus className="h-5 w-5 text-muted-foreground" />;
  };

  const getSurplusColor = () => {
    if (surplus > 0) return "text-green-600";
    if (surplus < 0) return "text-red-600";
    return "text-muted-foreground";
  };

  const getSurplusLabel = () => {
    if (surplus > 0) return "Monthly Surplus";
    if (surplus < 0) return "Monthly Deficit";
    return "Break Even";
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          What's your monthly cash flow?
        </h2>
        <p className="text-muted-foreground">
          This helps us recommend which debt to focus on first.
        </p>
      </div>

      <div className="space-y-4">
        {/* Monthly Income */}
        <div className="space-y-2">
          <Label htmlFor="income" className="text-foreground">
            Net Monthly Income (after taxes)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="income"
              type="text"
              inputMode="decimal"
              placeholder="4,500"
              value={incomeInput}
              onChange={(e) => handleIncomeChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="space-y-2">
          <Label htmlFor="expenses" className="text-foreground">
            Total Monthly Expenses (excluding debt payments)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="expenses"
              type="text"
              inputMode="decimal"
              placeholder="3,200"
              value={expensesInput}
              onChange={(e) => handleExpensesChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Include housing, utilities, groceries, insurance, etc. but not debt minimum payments.
          </p>
        </div>

        {/* Surplus Calculator */}
        {hasValidIncome && hasValidExpenses && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getSurplusIcon()}
                  <span className="text-sm font-medium text-foreground">
                    {getSurplusLabel()}
                  </span>
                </div>
                <span className={`text-xl font-bold ${getSurplusColor()}`}>
                  {formatCurrency(Math.abs(surplus))}
                  {surplus < 0 && "/mo"}
                  {surplus > 0 && "/mo"}
                </span>
              </div>
              
              {surplus > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Great! This is what you can put toward attacking your debt each month.
                </p>
              )}
              {surplus < 0 && (
                <p className="text-xs text-amber-600 mt-2">
                  We'll help you stabilize first before attacking debt aggressively.
                </p>
              )}
              {surplus === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  You're breaking even. We'll focus on the highest interest debt.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
