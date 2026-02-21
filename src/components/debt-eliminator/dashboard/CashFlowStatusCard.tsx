import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, ArrowRight, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { CashFlowStatus } from "@/lib/cashFlowCalculator";
import { getCashFlowLabel, formatCurrency } from "@/lib/cashFlowCalculator";

interface CashFlowStatusCardProps {
  surplus: number | null;
  status: CashFlowStatus | null;
}

export function CashFlowStatusCard({ surplus, status }: CashFlowStatusCardProps) {
  // Missing cash flow data state
  if (surplus === null || status === null) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/30 bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Complete Your Cash Flow</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your income and expenses to get personalized debt recommendations.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0 w-full sm:w-auto">
              <Link to="/profile">
                Go to Profile
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const iconMap = {
    surplus: TrendingUp,
    tight: Minus,
    deficit: TrendingDown,
  };

  const colorMap = {
    surplus: {
      text: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200 dark:border-green-800",
      icon: "text-green-600",
    },
    tight: {
      text: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-950/30",
      border: "border-yellow-200 dark:border-yellow-800",
      icon: "text-yellow-600",
    },
    deficit: {
      text: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800",
      icon: "text-red-600",
    },
  };

  const Icon = iconMap[status];
  const colors = colorMap[status];

  return (
    <Card className={cn("border", colors.border, colors.bg)}>
      <CardContent className="pt-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Cash Flow Snapshot</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn("p-2 rounded-full", colors.bg)}>
              <Icon className={cn("h-5 w-5", colors.icon)} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-muted-foreground">Monthly Surplus:</span>
                <span className={cn("text-xl font-bold", surplus >= 0 ? colors.text : "text-red-600")}>
                  {formatCurrency(surplus)}/mo
                </span>
              </div>
              <p className={cn("text-sm font-medium", colors.text)}>
                {getCashFlowLabel(status)}
              </p>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="shrink-0 w-full sm:w-auto">
            <Link to="/profile">
              Update in Profile
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
