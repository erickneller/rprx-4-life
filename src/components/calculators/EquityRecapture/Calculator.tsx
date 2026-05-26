// Equity Recapture Calculator — Main UI
// Combines the input form, the calculation, the results display,
// the saved-runs list, the save dialog, and the print button.

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Printer, Save } from 'lucide-react';
import {
  equityRecaptureSchema,
  DEFAULT_INPUTS,
  type EquityRecaptureFormValues,
} from './schema';
import { calculateEquityRecapture } from './calculations';
import { ResultsDisplay } from './ResultsDisplay';
import { SavedRunsList } from './SavedRunsList';
import { supabase } from '@/integrations/supabase/client';
import type { SavedRun, EquityRecaptureInputs } from './types';

export function EquityRecaptureCalculator() {
  const form = useForm<EquityRecaptureFormValues>({
    resolver: zodResolver(equityRecaptureSchema),
    defaultValues: DEFAULT_INPUTS,
  });

  const [committedInputs, setCommittedInputs] = useState<EquityRecaptureFormValues | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [runName, setRunName] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Run the calculation whenever committed inputs change
  const outputs = useMemo(() => {
    if (!committedInputs) return null;
    return calculateEquityRecapture(committedInputs as EquityRecaptureInputs);
  }, [committedInputs]);

  function onSubmit(values: EquityRecaptureFormValues) {
    setCommittedInputs(values);
  }

  async function handleSave() {
    if (!committedInputs || !outputs) return;
    if (!runName.trim()) {
      alert('Please give this calculation a name.');
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('You must be signed in to save calculations.');
      setSaving(false);
      return;
    }
    const { error } = await (supabase as any).from('calculator_runs').insert({
      user_id: user.id,
      calculator_type: 'equity_recapture',
      run_name: runName.trim(),
      inputs: committedInputs,
      outputs,
    });
    setSaving(false);
    if (error) {
      alert(`Save failed: ${error.message}`);
      return;
    }
    setSaveDialogOpen(false);
    setRunName('');
    setRefreshKey((k) => k + 1);
  }

  function handleLoadSavedRun(run: SavedRun) {
    form.reset(run.inputs as EquityRecaptureFormValues);
    setCommittedInputs(run.inputs as EquityRecaptureFormValues);
    // Scroll to top so the user sees the loaded inputs
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="space-y-6 print:space-y-3">
      {/* Page header */}
      <div className="print:hidden">
        <h1 className="text-3xl font-bold text-slate-900">
          Equity Recapture Calculator
        </h1>
        <p className="text-slate-600 mt-1">
          Compare a paid-as-scheduled mortgage against the same loan with extra
          principal payments. See exactly how much interest you save and how
          many years you cut off the clock.
        </p>
      </div>

      {/* Print header (only visible when printing) */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">
          RPRx — Equity Recapture Calculation
        </h1>
        <p className="text-sm text-slate-600">
          Generated {new Date().toLocaleDateString()}
        </p>
        <hr className="my-2" />
      </div>

      {/* Input form */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Your Mortgage</CardTitle>
          <CardDescription>
            All fields are required except extra payments (set to 0 to model
            paying as scheduled).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <FormField
              label="Loan Amount ($)"
              error={form.formState.errors.loanAmount?.message}
            >
              <Input
                type="number"
                step="1000"
                {...form.register('loanAmount', { valueAsNumber: true })}
              />
            </FormField>

            <FormField
              label="Annual Interest Rate (%)"
              error={form.formState.errors.annualInterestRate?.message}
              hint="Enter as percent. 6.5 means 6.5%."
            >
              <Input
                type="number"
                step="0.01"
                value={
                  form.watch('annualInterestRate') !== undefined
                    ? form.watch('annualInterestRate') * 100
                    : ''
                }
                onChange={(e) => {
                  const pct = parseFloat(e.target.value);
                  form.setValue(
                    'annualInterestRate',
                    isNaN(pct) ? 0 : pct / 100,
                  );
                }}
              />
            </FormField>

            <FormField
              label="Term"
              error={form.formState.errors.termMonths?.message}
            >
              <Select
                value={String(form.watch('termMonths'))}
                onValueChange={(v) =>
                  form.setValue('termMonths', parseInt(v, 10))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="180">15 years (180 months)</SelectItem>
                  <SelectItem value="240">20 years (240 months)</SelectItem>
                  <SelectItem value="300">25 years (300 months)</SelectItem>
                  <SelectItem value="360">30 years (360 months)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <div /> {/* spacer */}

            <FormField
              label="Extra Monthly Payment ($)"
              error={form.formState.errors.extraMonthlyPayment?.message}
              hint="Applied every month, on top of scheduled P&I."
            >
              <Input
                type="number"
                step="50"
                {...form.register('extraMonthlyPayment', {
                  valueAsNumber: true,
                })}
              />
            </FormField>

            <FormField
              label="Extra Annual Payment ($)"
              error={form.formState.errors.extraAnnualPayment?.message}
              hint="Lump sum applied once per year (e.g., tax refund)."
            >
              <Input
                type="number"
                step="500"
                {...form.register('extraAnnualPayment', {
                  valueAsNumber: true,
                })}
              />
            </FormField>

            <FormField
              label="Month of Annual Payment"
              error={form.formState.errors.annualPaymentMonth?.message}
            >
              <Select
                value={String(form.watch('annualPaymentMonth'))}
                onValueChange={(v) =>
                  form.setValue('annualPaymentMonth', parseInt(v, 10))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    'January', 'February', 'March', 'April',
                    'May', 'June', 'July', 'August',
                    'September', 'October', 'November', 'December',
                  ].map((m, i) => (
                    <SelectItem key={i} value={String(i + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="sm:col-span-2 flex flex-wrap gap-3 pt-2">
              <Button type="submit">Calculate</Button>
              {outputs && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSaveDialogOpen(true)}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Calculation
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.print()}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print / Save as PDF
                  </Button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {outputs && committedInputs && (
        <ResultsDisplay inputs={committedInputs} outputs={outputs} />
      )}

      {/* Saved runs (hidden on print) */}
      <div className="print:hidden">
        <SavedRunsList onLoad={handleLoadSavedRun} refreshKey={refreshKey} />
      </div>

      {/* Save dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save This Calculation</DialogTitle>
            <DialogDescription>
              Give this run a name so you can find it later — e.g.,
              "My current mortgage" or "If I add $500/mo".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="run-name">Name</Label>
            <Input
              id="run-name"
              value={runName}
              onChange={(e) => setRunName(e.target.value)}
              placeholder="e.g., Baseline mortgage"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setSaveDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print footer */}
      <div className="hidden print:block text-xs text-slate-500 mt-6">
        <hr className="mb-2" />
        <p>
          Generated by RPRx Equity Recapture Calculator · rprx4life.com ·
          Educational use only. Not financial advice.
        </p>
      </div>
    </div>
  );
}

function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
