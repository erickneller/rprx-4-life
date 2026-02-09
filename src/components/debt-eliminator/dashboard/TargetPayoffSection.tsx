import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, DollarSign, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { UserDebt } from "@/lib/debtTypes";
import { formatCurrency } from "@/lib/debtTypes";

interface TargetPayoffSectionProps {
  focusDebt: UserDebt;
  monthlySurplus: number | null;
  targetMonths: number;
  onTargetMonthsChange: (months: number) => void;
}

type PayoffStatus = "on_track" | "tight" | "gap";

function getStatus(extraNeeded: number, surplus: number): PayoffStatus {
  if (surplus >= extraNeeded) return "on_track";
  if (surplus > 0) return "tight";
  return "gap";
}

const STATUS_CONFIG: Record<PayoffStatus, {
  label: string;
  badgeClass: string;
  icon: React.ReactNode;
  getMessage: (gap: number) => string;
}> = {
  on_track: {
    label: "On Track",
    badgeClass: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    getMessage: () => "Your current cash flow supports this goal.",
  },
  tight: {
    label: "Tight",
    badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    getMessage: () => "You're close. A small adjustment can get you there.",
  },
  gap: {
    label: "Gap",
    badgeClass: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    getMessage: (gap: number) => `You'll need to free up ${formatCurrency(gap)}/mo to hit this goal.`,
  },
};

export function TargetPayoffSection({
  focusDebt,
  monthlySurplus,
  targetMonths,
  onTargetMonthsChange,
}: TargetPayoffSectionProps) {
  const surplus = monthlySurplus ?? 0;
  const requiredPayment = focusDebt.current_balance / targetMonths;
  const extraNeeded = Math.max(0, requiredPayment - focusDebt.min_payment);
  const cashFlowGap = Math.max(0, extraNeeded - surplus);
  const status = getStatus(extraNeeded, surplus);
  const config = STATUS_CONFIG[status];

  const handleMonthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && val <= 36) {
      onTargetMonthsChange(val);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Target Payoff Goal</span>
        </div>
        <Badge variant="outline" className={config.badgeClass}>
          <span className="flex items-center gap-1">
            {config.icon}
            {config.label}
          </span>
        </Badge>
      </div>

      {/* Month input */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Pay off in:</span>
        <Input
          type="number"
          min={1}
          max={36}
          value={targetMonths}
          onChange={handleMonthsChange}
          className="w-16 h-8 text-center text-sm"
        />
        <span className="text-sm text-muted-foreground">months</span>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <DollarSign className="h-3.5 w-3.5" />
          Required:
        </div>
        <span className="font-medium text-foreground text-right">
          {formatCurrency(requiredPayment)}/mo
        </span>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <DollarSign className="h-3.5 w-3.5" />
          Minimum:
        </div>
        <span className="text-right text-muted-foreground">
          {formatCurrency(focusDebt.min_payment)}/mo
        </span>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" />
          Extra needed:
        </div>
        <span className="font-medium text-foreground text-right">
          {formatCurrency(extraNeeded)}/mo
        </span>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" />
          Your surplus:
        </div>
        <span className={`font-medium text-right ${surplus >= extraNeeded ? "text-green-600" : "text-foreground"}`}>
          {formatCurrency(surplus)}/mo
        </span>
      </div>

      {/* Status message */}
      <p className="text-sm italic text-muted-foreground">{config.getMessage(cashFlowGap)}</p>
    </div>
  );
}
