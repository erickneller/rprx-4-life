import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { UserDebt } from "@/lib/debtTypes";
import { formatCurrency, DEBT_TYPE_LABELS } from "@/lib/debtTypes";

interface LogPaymentDialogProps {
  debt: UserDebt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (debtId: string, amount: number, note?: string) => void;
  isLoading?: boolean;
}

export function LogPaymentDialog({
  debt,
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: LogPaymentDialogProps) {
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (debt) {
      // Default to minimum payment if set, otherwise empty
      setAmount(debt.min_payment > 0 ? debt.min_payment : 0);
      setNote("");
      setError("");
    }
  }, [debt]);

  const validateForm = (): boolean => {
    if (!debt) return false;

    if (amount <= 0) {
      setError("Payment amount must be greater than 0");
      return false;
    }
    if (amount > debt.current_balance) {
      setError("Payment cannot exceed current balance");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debt && validateForm()) {
      onSubmit(debt.id, amount, note.trim() || undefined);
    }
  };

  const handleClose = () => {
    setAmount(0);
    setNote("");
    setError("");
    onOpenChange(false);
  };

  if (!debt) return null;

  const newBalance = Math.max(0, debt.current_balance - amount);
  const willPayOff = newBalance === 0 && amount > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Log Payment</DialogTitle>
          <DialogDescription>
            Record a payment for {debt.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Debt Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Debt</span>
              <span className="font-medium">{debt.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Type</span>
              <span>{DEBT_TYPE_LABELS[debt.debt_type]}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Balance</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(debt.current_balance)}
              </span>
            </div>
            {debt.min_payment > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Min Payment</span>
                <span>{formatCurrency(debt.min_payment)}</span>
              </div>
            )}
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Payment Amount ($)</Label>
            <Input
              id="payment-amount"
              type="number"
              min="0.01"
              max={debt.current_balance}
              step="0.01"
              value={amount || ""}
              onChange={(e) => {
                setAmount(parseFloat(e.target.value) || 0);
                setError("");
              }}
              placeholder="Enter payment amount"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="payment-note">Note (optional)</Label>
            <Textarea
              id="payment-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Extra payment from tax refund"
              rows={2}
            />
          </div>

          {/* Preview */}
          {amount > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New Balance</span>
                <span className={`font-semibold ${willPayOff ? "text-green-600" : "text-foreground"}`}>
                  {formatCurrency(newBalance)}
                </span>
              </div>
              {willPayOff && (
                <p className="text-sm text-green-600 font-medium">
                  🎉 This payment will pay off this debt!
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || amount <= 0}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging...
                </>
              ) : (
                "Log Payment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
