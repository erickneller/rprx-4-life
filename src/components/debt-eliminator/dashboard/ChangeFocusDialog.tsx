import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Target } from "lucide-react";
import { useState } from "react";
import type { UserDebt } from "@/lib/debtTypes";
import type { RankedDebt, DebtRecommendation } from "@/lib/debtRecommendationEngine";
import { formatCurrency, DEBT_TYPE_LABELS } from "@/lib/debtTypes";

interface ChangeFocusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rankedDebts: RankedDebt[];
  currentFocusId: string;
  recommendedFocusId: string;
  recommendation: DebtRecommendation;
  onConfirm: (debtId: string) => void;
  isLoading?: boolean;
}

export function ChangeFocusDialog({
  open,
  onOpenChange,
  rankedDebts,
  currentFocusId,
  recommendedFocusId,
  recommendation,
  onConfirm,
  isLoading,
}: ChangeFocusDialogProps) {
  const [selectedId, setSelectedId] = useState(currentFocusId);

  const handleConfirm = () => {
    onConfirm(selectedId);
  };

  const isSelectingRecommended = selectedId === recommendedFocusId;
  const isChangingFromRecommended = currentFocusId === recommendedFocusId && selectedId !== recommendedFocusId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Focus Debt</DialogTitle>
          <DialogDescription>
            Choose which debt you want to focus on. We recommend tackling one at
            a time for best results.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={selectedId} onValueChange={setSelectedId}>
            <div className="space-y-3">
              {rankedDebts.map((ranked) => {
                const isRecommended = ranked.debt.id === recommendedFocusId;
                const isCurrent = ranked.debt.id === currentFocusId;

                return (
                  <div
                    key={ranked.debt.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                      selectedId === ranked.debt.id
                        ? "border-accent bg-accent/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem
                      value={ranked.debt.id}
                      id={ranked.debt.id}
                      className="mt-1"
                    />
                    <Label
                      htmlFor={ranked.debt.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ranked.debt.name}</span>
                          {isRecommended && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-accent/20 text-accent"
                            >
                              <Target className="h-3 w-3 mr-1" />
                              Recommended
                            </Badge>
                          )}
                          {isCurrent && !isRecommended && (
                            <Badge variant="outline" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          #{ranked.rank}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {formatCurrency(ranked.debt.current_balance)} •{" "}
                        {ranked.debt.interest_rate}% APR •{" "}
                        {DEBT_TYPE_LABELS[ranked.debt.debt_type]}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ranked.reason}
                      </p>
                    </Label>
                  </div>
                );
              })}
            </div>
          </RadioGroup>

          {/* Warning when switching away from recommended */}
          {isChangingFromRecommended && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700 dark:text-amber-400">
                  <p className="font-medium">Switching from our recommendation</p>
                  <p className="mt-1">
                    {recommendation.reason} But if{" "}
                    {rankedDebts.find((r) => r.debt.id === selectedId)?.debt.name}{" "}
                    motivates you more, that's okay! Consistency matters most.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || selectedId === currentFocusId}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isLoading ? "Saving..." : "Set as Focus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
