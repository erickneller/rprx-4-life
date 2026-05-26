// Equity Recapture Calculator — Results display
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  formatCurrency,
  formatPercent,
  formatYears,
  sampleByYear,
} from './calculations';
import type { EquityRecaptureInputs, EquityRecaptureOutputs } from './types';
import { TrendingDown, Calendar, DollarSign, PiggyBank } from 'lucide-react';

interface Props {
  inputs: EquityRecaptureInputs;
  outputs: EquityRecaptureOutputs;
}

export function ResultsDisplay({ inputs, outputs }: Props) {
  const acceleratedYears = outputs.accelerated.yearsToPayoff;
  const baselineYears = outputs.baseline.yearsToPayoff;

  return (
    <div className="space-y-6">
      {/* Headline KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<PiggyBank className="h-5 w-5" />}
          label="Interest Saved"
          value={formatCurrency(outputs.interestSavings)}
          accent="green"
        />
        <KpiCard
          icon={<Calendar className="h-5 w-5" />}
          label="Years Saved"
          value={formatYears(outputs.yearsSaved)}
          accent="navy"
        />
        <KpiCard
          icon={<TrendingDown className="h-5 w-5" />}
          label="Payoff (accelerated)"
          value={formatYears(acceleratedYears)}
          accent="navy"
        />
        <KpiCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Monthly P&I"
          value={formatCurrency(outputs.monthlyPayment, true)}
          accent="muted"
        />
      </div>

      {/* Side-by-side comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Comparison</CardTitle>
          <CardDescription>
            Your current plan vs. paying as scheduled with no extras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Baseline (no extras)</TableHead>
                <TableHead className="text-right">Your plan</TableHead>
                <TableHead className="text-right">Difference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <Row
                label="Years to payoff"
                baseline={formatYears(baselineYears)}
                accelerated={formatYears(acceleratedYears)}
                diff={formatYears(outputs.yearsSaved)}
              />
              <Row
                label="Total interest"
                baseline={formatCurrency(outputs.baseline.totalInterest)}
                accelerated={formatCurrency(outputs.accelerated.totalInterest)}
                diff={formatCurrency(outputs.interestSavings)}
                highlight
              />
              <Row
                label="Total of all payments"
                baseline={formatCurrency(outputs.baseline.totalPayments)}
                accelerated={formatCurrency(outputs.accelerated.totalPayments)}
                diff={formatCurrency(
                  outputs.baseline.totalPayments -
                    outputs.accelerated.totalPayments,
                )}
              />
              <Row
                label="Total extra paid"
                baseline={formatCurrency(0)}
                accelerated={formatCurrency(
                  outputs.accelerated.totalExtraPayments,
                )}
                diff="—"
              />
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Year-by-year balance comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Balance by Year</CardTitle>
          <CardDescription>
            How fast each scenario reduces your principal balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <YearByYearTable
            initialBalance={inputs.loanAmount}
            accelerated={sampleByYear(
              outputs.accelerated.schedule,
              inputs.loanAmount,
            )}
            baseline={sampleByYear(
              outputs.baseline.schedule,
              inputs.loanAmount,
            )}
          />
        </CardContent>
      </Card>

      {/* Input recap for the print view */}
      <Card className="print:break-before-page">
        <CardHeader>
          <CardTitle>Inputs Used</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <InputRow
              label="Loan amount"
              value={formatCurrency(inputs.loanAmount)}
            />
            <InputRow
              label="Annual interest rate"
              value={formatPercent(inputs.annualInterestRate)}
            />
            <InputRow
              label="Term"
              value={`${inputs.termMonths} months (${(inputs.termMonths / 12).toFixed(0)} years)`}
            />
            <InputRow
              label="Extra monthly payment"
              value={formatCurrency(inputs.extraMonthlyPayment)}
            />
            <InputRow
              label="Extra annual payment"
              value={formatCurrency(inputs.extraAnnualPayment)}
            />
            <InputRow
              label="Annual payment month"
              value={String(inputs.annualPaymentMonth)}
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Sub-components ----------

function KpiCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: 'green' | 'navy' | 'muted';
}) {
  const accentClass =
    accent === 'green'
      ? 'border-l-emerald-600 bg-emerald-50'
      : accent === 'navy'
        ? 'border-l-slate-700 bg-slate-50'
        : 'border-l-slate-300 bg-white';
  const valueClass =
    accent === 'green'
      ? 'text-emerald-700'
      : accent === 'navy'
        ? 'text-slate-900'
        : 'text-slate-700';

  return (
    <Card className={`border-l-4 ${accentClass}`}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          {icon}
          <span>{label}</span>
        </div>
        <div className={`text-2xl font-bold mt-2 ${valueClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  baseline,
  accelerated,
  diff,
  highlight = false,
}: {
  label: string;
  baseline: string;
  accelerated: string;
  diff: string;
  highlight?: boolean;
}) {
  return (
    <TableRow className={highlight ? 'bg-emerald-50/50 font-medium' : ''}>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell className="text-right">{baseline}</TableCell>
      <TableCell className="text-right">{accelerated}</TableCell>
      <TableCell
        className={`text-right ${highlight ? 'text-emerald-700' : ''}`}
      >
        {diff}
      </TableCell>
    </TableRow>
  );
}

function InputRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1">
      <dt className="text-slate-600">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function YearByYearTable({
  initialBalance,
  accelerated,
  baseline,
}: {
  initialBalance: number;
  accelerated: Array<{ year: number; balance: number }>;
  baseline: Array<{ year: number; balance: number }>;
}) {
  const maxYears = Math.max(
    accelerated[accelerated.length - 1]?.year ?? 0,
    baseline[baseline.length - 1]?.year ?? 0,
  );
  const yearsToShow = Math.ceil(maxYears);

  // Build a unified row set keyed by integer year
  const baseByYear = new Map(baseline.map((s) => [Math.floor(s.year), s.balance]));
  const accByYear = new Map(
    accelerated.map((s) => [Math.floor(s.year), s.balance]),
  );

  const rows = [{ year: 0, baseline: initialBalance, accelerated: initialBalance }];
  for (let y = 1; y <= yearsToShow; y++) {
    rows.push({
      year: y,
      baseline: baseByYear.get(y) ?? 0,
      accelerated: accByYear.get(y) ?? 0,
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Year</TableHead>
          <TableHead className="text-right">Baseline Balance</TableHead>
          <TableHead className="text-right">Your Plan Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.year}>
            <TableCell>{r.year}</TableCell>
            <TableCell className="text-right">
              {formatCurrency(r.baseline)}
            </TableCell>
            <TableCell className="text-right font-medium text-emerald-700">
              {formatCurrency(r.accelerated)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
