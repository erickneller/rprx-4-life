import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, Target, TrendingUp, Clock, DollarSign } from "lucide-react";
import type { DebtJourney, UserDebt } from "@/lib/debtTypes";
import {
  calculateProgressPercent,
  calculateTotalPaid,
  calculateTotalRemaining,
  formatCurrency,
} from "@/lib/debtTypes";
import { DebtCard } from "./DebtCard";

interface DebtDashboardProps {
  journey: DebtJourney;
  debts: UserDebt[];
}

export function DebtDashboard({ journey, debts }: DebtDashboardProps) {
  const progress = calculateProgressPercent(debts);
  const totalPaid = calculateTotalPaid(debts);
  const totalRemaining = calculateTotalRemaining(debts);
  const totalOriginal = debts.reduce((sum, d) => sum + d.original_balance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Your Debt Freedom Journey
          </h1>
          <p className="text-muted-foreground">
            Keep going! You're making progress.
          </p>
        </div>
        <Button className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
          <Plus className="h-4 w-4" />
          Add Debt
        </Button>
      </div>

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
              <Clock className="h-4 w-4" />
              <span className="text-sm">Debts</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{debts.length}</p>
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

          {/* Dream visualization */}
          {journey.dream_text && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-1">Your Dream</p>
              <p className="text-foreground italic">"{journey.dream_text}"</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debt list */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Your Debts</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {debts.map((debt) => (
            <DebtCard key={debt.id} debt={debt} />
          ))}
        </div>
      </div>

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
    </div>
  );
}
