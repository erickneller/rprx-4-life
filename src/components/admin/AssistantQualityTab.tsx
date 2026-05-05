import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface EventRow {
  id: string;
  parser_path: string | null;
  strategy_source: string | null;
  chosen_strategy_id: string | null;
  ranker_score: number | null;
  step_count: number | null;
  latency_ms: number | null;
  mode: string | null;
  tier: string | null;
  model_variant: string | null;
  created_at: string;
}

function pct(n: number, total: number) {
  return total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '—';
}
function p(arr: number[], q: number) {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * q));
  return sorted[idx];
}

export function AssistantQualityTab() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<EventRow[]>([]);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const { data } = await (supabase as any)
        .from('plan_generation_events')
        .select('id, parser_path, strategy_source, chosen_strategy_id, ranker_score, step_count, latency_ms, mode, tier, model_variant, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1000);
      setRows((data || []) as EventRow[]);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const byPath: Record<string, number> = {};
    const byTier: Record<string, number> = {};
    const byMode: Record<string, number> = {};
    const latencies: number[] = [];
    const stepCounts: number[] = [];
    const byStrategy: Record<string, number> = {};

    for (const r of rows) {
      const path = r.parser_path || 'unknown';
      byPath[path] = (byPath[path] || 0) + 1;
      byTier[r.tier || 'unknown'] = (byTier[r.tier || 'unknown'] || 0) + 1;
      byMode[r.mode || 'unknown'] = (byMode[r.mode || 'unknown'] || 0) + 1;
      if (typeof r.latency_ms === 'number') latencies.push(r.latency_ms);
      if (typeof r.step_count === 'number') stepCounts.push(r.step_count);
      if (r.chosen_strategy_id) byStrategy[r.chosen_strategy_id] = (byStrategy[r.chosen_strategy_id] || 0) + 1;
    }
    const topStrategies = Object.entries(byStrategy).sort((a, b) => b[1] - a[1]).slice(0, 10);

    return {
      total,
      byPath,
      byTier,
      byMode,
      latencyP50: p(latencies, 0.5),
      latencyP95: p(latencies, 0.95),
      avgSteps: stepCounts.length ? stepCounts.reduce((a, b) => a + b, 0) / stepCounts.length : null,
      topStrategies,
    };
  }, [rows]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Events (7d)" value={stats.total.toString()} />
        <StatCard label="p50 latency" value={stats.latencyP50 != null ? `${stats.latencyP50} ms` : '—'} />
        <StatCard label="p95 latency" value={stats.latencyP95 != null ? `${stats.latencyP95} ms` : '—'} />
        <StatCard label="Avg steps" value={stats.avgSteps != null ? stats.avgSteps.toFixed(1) : '—'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BreakdownCard title="Parser path" entries={stats.byPath} total={stats.total} />
        <BreakdownCard title="Tier" entries={stats.byTier} total={stats.total} />
        <BreakdownCard title="Mode" entries={stats.byMode} total={stats.total} />
      </div>

      <Card>
        <CardHeader><CardTitle>Top strategies (last 7d)</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Strategy ID</TableHead>
                <TableHead className="text-right">Generated</TableHead>
                <TableHead className="text-right">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.topStrategies.map(([sid, n]) => (
                <TableRow key={sid}>
                  <TableCell className="font-mono text-xs">{sid}</TableCell>
                  <TableCell className="text-right">{n}</TableCell>
                  <TableCell className="text-right">{pct(n, stats.total)}</TableCell>
                </TableRow>
              ))}
              {stats.topStrategies.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No data yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function BreakdownCard({ title, entries, total }: { title: string; entries: Record<string, number>; total: number }) {
  const items = Object.entries(entries).sort((a, b) => b[1] - a[1]);
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-1.5">
        {items.length === 0 && <p className="text-sm text-muted-foreground">No data yet.</p>}
        {items.map(([k, n]) => (
          <div key={k} className="flex items-center justify-between text-sm">
            <span className="font-mono text-xs truncate">{k}</span>
            <span className="text-muted-foreground">{n} <span className="text-xs">({pct(n, total)})</span></span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
