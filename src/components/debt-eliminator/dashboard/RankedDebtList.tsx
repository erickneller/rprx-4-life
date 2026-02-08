import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { DollarSign, Pencil, Target, Clock } from "lucide-react";
import type { UserDebt } from "@/lib/debtTypes";
import type { RankedDebt } from "@/lib/debtRecommendationEngine";
import { formatCurrency, DEBT_TYPE_LABELS } from "@/lib/debtTypes";

interface RankedDebtListProps {
  rankedDebts: RankedDebt[];
  focusDebtId: string;
  onEditDebt: (debt: UserDebt) => void;
  onLogPayment: (debt: UserDebt) => void;
}

export function RankedDebtList({
  rankedDebts,
  focusDebtId,
  onEditDebt,
  onLogPayment,
}: RankedDebtListProps) {
  // Filter out the focus debt - it's shown separately
  const otherDebts = rankedDebts.filter((r) => r.debt.id !== focusDebtId);

  if (otherDebts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Your Other Debts
        </h2>
        <span className="text-sm text-muted-foreground">
          Recommended order shown
        </span>
      </div>

      <div className="space-y-3">
        {otherDebts.map((ranked) => {
          const { debt, rank, reason, estimatedPayoffMonths } = ranked;
          const progress = Math.round(
            ((debt.original_balance - debt.current_balance) /
              debt.original_balance) *
              100
          );

          return (
            <Card key={debt.id} className="relative overflow-hidden">
              {/* Rank Badge */}
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="text-xs">
                  #{rank}
                </Badge>
              </div>

              <CardContent className="pt-4 pb-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="pr-12">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {debt.name}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {DEBT_TYPE_LABELS[debt.debt_type]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reason}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className="flex items-center gap-1 text-foreground font-medium">
                      <DollarSign className="h-3 w-3" />
                      {formatCurrency(debt.current_balance)}
                    </span>
                    <span className="text-muted-foreground">
                      {debt.interest_rate}% APR
                    </span>
                    <span className="text-muted-foreground">
                      ${debt.min_payment}/mo min
                    </span>
                    {estimatedPayoffMonths && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />~{estimatedPayoffMonths} mo
                      </span>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progress}% paid</span>
                      <span>{formatCurrency(debt.original_balance)} total</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onLogPayment(debt)}
                      className="text-xs"
                    >
                      <DollarSign className="h-3 w-3 mr-1" />
                      Log Payment
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditDebt(debt)}
                      className="text-xs"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Encouragement */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          💪 Focus on your #1 debt first. Once it's paid off, move to #2!
        </p>
      </div>
    </div>
  );
}
