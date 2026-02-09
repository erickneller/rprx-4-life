import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, AlertTriangle, DollarSign, Clock, Settings2 } from "lucide-react";
import type { UserDebt } from "@/lib/debtTypes";
import type { DebtRecommendation } from "@/lib/debtRecommendationEngine";
import { formatCurrency, DEBT_TYPE_LABELS } from "@/lib/debtTypes";

interface FocusDebtCardProps {
  focusDebt: UserDebt;
  recommendation: DebtRecommendation;
  isOverride: boolean;
  recommendedDebt?: UserDebt;
  onLogPayment: () => void;
  onChangeFocus: () => void;
}

export function FocusDebtCard({
  focusDebt,
  recommendation,
  isOverride,
  recommendedDebt,
  onLogPayment,
  onChangeFocus,
}: FocusDebtCardProps) {
  const progress = Math.round(
    ((focusDebt.original_balance - focusDebt.current_balance) /
      focusDebt.original_balance) *
      100
  );

  const isStabilizeMode = recommendation.mode === "stabilize";

  return (
    <Card
      className={`border-2 ${
        isStabilizeMode
          ? "border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/20"
          : "border-accent/50 bg-accent/5"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isStabilizeMode ? (
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            ) : (
              <Target className="h-5 w-5 text-accent" />
            )}
            <CardTitle className="text-lg">
              {isStabilizeMode ? "Stabilize Mode" : "Your Focus"}
            </CardTitle>
          </div>
          <Badge
            variant={isStabilizeMode ? "outline" : "default"}
            className={
              isStabilizeMode
                ? "border-amber-500 text-amber-600"
                : "bg-accent text-accent-foreground"
            }
          >
            {isStabilizeMode ? "Watch Debt" : "Attack Mode"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Debt Info */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xl font-bold text-foreground">
              {focusDebt.name}
            </h3>
            <span className="text-sm text-muted-foreground">
              {DEBT_TYPE_LABELS[focusDebt.debt_type]}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {formatCurrency(focusDebt.current_balance)} remaining
            </span>
            <span>{focusDebt.interest_rate}% APR</span>
          </div>
        </div>

        {/* Recommendation Reason */}
        <div
          className={`p-3 rounded-lg ${
            isStabilizeMode
              ? "bg-amber-100/50 dark:bg-amber-900/20"
              : "bg-accent/10"
          }`}
        >
          {isOverride && recommendedDebt ? (
            <p className="text-sm font-semibold text-foreground">
              Recommendation: Focus on {recommendedDebt.name} because {recommendation.reason.charAt(0).toLowerCase() + recommendation.reason.slice(1)}
            </p>
          ) : (
            <p className="text-sm text-foreground">{recommendation.reason}</p>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{progress}% paid off</span>
            {recommendation.estimatedPayoffMonths && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />~{recommendation.estimatedPayoffMonths} months
              </span>
            )}
          </div>
          <Progress
            value={progress}
            className={`h-3 ${isStabilizeMode ? "[&>div]:bg-amber-500" : ""}`}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onLogPayment}
            className={`flex-1 ${
              isStabilizeMode
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-accent hover:bg-accent/90 text-accent-foreground"
            }`}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Log Payment
          </Button>
          <Button variant="outline" onClick={onChangeFocus} className="gap-2">
            <Settings2 className="h-4 w-4" />
            Change Focus
          </Button>
        </div>

        {/* Stabilize Mode Extra Info */}
        {isStabilizeMode && (
          <div className="pt-2 border-t border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              💡 Tip: Focus on reducing expenses or increasing income before
              attacking debt aggressively. Pay minimums on all debts for now.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
