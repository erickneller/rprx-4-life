// Equity Recapture Calculator — Saved Runs list
// Loads the current user's saved runs from Supabase and lets them reload or delete.

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatYears } from './calculations';
import { Trash2, RotateCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { SavedRun } from './types';

interface Props {
  onLoad: (run: SavedRun) => void;
  refreshKey?: number; // bump this to trigger reload after a save
}

export function SavedRunsList({ onLoad, refreshKey = 0 }: Props) {
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('calculator_runs')
        .select('*')
        .eq('calculator_type', 'equity_recapture')
        .order('created_at', { ascending: false });

      if (cancelled) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setRuns((data ?? []) as SavedRun[]);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this saved calculation? This cannot be undone.')) return;
    const { error } = await supabase
      .from('calculator_runs')
      .delete()
      .eq('id', id);
    if (error) {
      alert(`Could not delete: ${error.message}`);
      return;
    }
    setRuns((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Saved Calculations</CardTitle>
        <CardDescription>
          Reload any saved run to edit its inputs and re-run, or delete it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-slate-600">Loading…</p>}
        {error && (
          <p className="text-sm text-red-600">Could not load saved runs: {error}</p>
        )}
        {!loading && !error && runs.length === 0 && (
          <p className="text-sm text-slate-600">
            You haven't saved any calculations yet. Run one and click Save.
          </p>
        )}
        {!loading && !error && runs.length > 0 && (
          <ul className="divide-y divide-slate-200">
            {runs.map((run) => (
              <li key={run.id} className="py-3 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{run.run_name}</p>
                  <p className="text-xs text-slate-600">
                    {formatCurrency(run.inputs.loanAmount)} loan @{' '}
                    {(run.inputs.annualInterestRate * 100).toFixed(2)}% ·
                    Saves {formatCurrency(run.outputs.interestSavings)} ·
                    Payoff {formatYears(run.outputs.accelerated.yearsToPayoff)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Saved {new Date(run.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLoad(run)}
                  >
                    <RotateCw className="h-4 w-4 mr-1" />
                    Load
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(run.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
