import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  GraduationCap,
  Car,
  Home,
  Banknote,
  Stethoscope,
  CircleDot,
  Plus,
  CheckCircle2,
} from "lucide-react";
import type { UserDebt, DebtType } from "@/lib/debtTypes";
import { DEBT_TYPE_LABELS, formatCurrency } from "@/lib/debtTypes";

interface DebtCardProps {
  debt: UserDebt;
  onLogPayment?: () => void;
}

const DEBT_ICONS: Record<DebtType, React.ReactNode> = {
  credit_card: <CreditCard className="h-5 w-5" />,
  student_loan: <GraduationCap className="h-5 w-5" />,
  auto_loan: <Car className="h-5 w-5" />,
  mortgage: <Home className="h-5 w-5" />,
  personal_loan: <Banknote className="h-5 w-5" />,
  medical: <Stethoscope className="h-5 w-5" />,
  other: <CircleDot className="h-5 w-5" />,
};

export function DebtCard({ debt, onLogPayment }: DebtCardProps) {
  const progress = Math.round(
    ((debt.original_balance - debt.current_balance) / debt.original_balance) *
      100
  );
  const isPaidOff = debt.current_balance === 0 || debt.paid_off_at;

  return (
    <Card className={isPaidOff ? "border-green-500/50 bg-green-500/5" : ""}>
      <CardContent className="pt-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              {DEBT_ICONS[debt.debt_type]}
            </div>
            <div>
              <p className="font-medium text-foreground">{debt.name}</p>
              <p className="text-xs text-muted-foreground">
                {DEBT_TYPE_LABELS[debt.debt_type]}
              </p>
            </div>
          </div>
          {isPaidOff && (
            <Badge
              variant="outline"
              className="bg-green-500/10 text-green-600 border-green-500/30"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Paid Off
            </Badge>
          )}
        </div>

        {/* Balance */}
        <div>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(debt.current_balance)}
          </p>
          <p className="text-xs text-muted-foreground">
            of {formatCurrency(debt.original_balance)} original
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{progress}% paid</span>
            {debt.interest_rate > 0 && (
              <span className="text-muted-foreground">
                {debt.interest_rate}% APR
              </span>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Action */}
        {!isPaidOff && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={onLogPayment}
          >
            <Plus className="h-4 w-4" />
            Log Payment
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
