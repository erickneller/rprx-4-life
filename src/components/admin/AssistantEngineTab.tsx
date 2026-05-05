import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const ROW_ID = 'strategy_engine_v2_default';

interface EngineConfig {
  weights?: { horseman_match?: number; goal_match?: number; urgency?: number; feasibility?: number; impact?: number };
  penalties?: { active_strategy?: number; completed_strategy?: number };
  output?: {
    auto_mode_results?: number;
    auto_mode_multi_plans?: number;
    manual_mode_results?: number;
    manual_mode_multi_plans?: number;
    diversify_horseman?: boolean;
    max_steps_shown?: number;
  };
}

export function AssistantEngineTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('Strategy Engine V2 Default');
  const [active, setActive] = useState(true);
  const [cfg, setCfg] = useState<EngineConfig>({});

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('prompt_engine_config')
        .select('*')
        .eq('id', ROW_ID)
        .maybeSingle();
      if (data) {
        setName(data.name || 'Strategy Engine');
        setActive(!!data.is_active);
        setCfg(data.config || {});
      }
      setLoading(false);
    })();
  }, []);

  const setWeight = (k: keyof NonNullable<EngineConfig['weights']>, v: number) =>
    setCfg(c => ({ ...c, weights: { ...c.weights, [k]: v } }));
  const setOutput = (k: keyof NonNullable<EngineConfig['output']>, v: any) =>
    setCfg(c => ({ ...c, output: { ...c.output, [k]: v } }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await (supabase as any).from('prompt_engine_config').upsert({
      id: ROW_ID,
      name,
      is_active: active,
      config: cfg,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) toast.error('Save failed: ' + error.message);
    else toast.success('Engine config saved. Edge function picks up within 60s.');
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const w = cfg.weights || {};
  const o = cfg.output || {};

  return (
    <div className="space-y-4 max-w-3xl">
      <Card>
        <CardHeader><CardTitle>Strategy Engine</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Config name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={active} onCheckedChange={setActive} id="active" />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ranker weights</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {(['horseman_match','goal_match','urgency','feasibility','impact'] as const).map(k => (
            <div key={k} className="space-y-1">
              <Label className="capitalize">{k.replace('_',' ')}</Label>
              <Input type="number" value={w[k] ?? 0} onChange={e => setWeight(k, Number(e.target.value))} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Output</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Auto-mode plans (multi)</Label>
            <Input type="number" min={1} max={5} value={o.auto_mode_multi_plans ?? 3} onChange={e => setOutput('auto_mode_multi_plans', Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">Max strategies returned in one auto-mode reply (1–5).</p>
          </div>
          <div className="space-y-1">
            <Label>Manual-mode plans (multi)</Label>
            <Input type="number" min={1} max={5} value={o.manual_mode_multi_plans ?? 3} onChange={e => setOutput('manual_mode_multi_plans', Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">Max strategies returned per chat reply (1–5).</p>
          </div>
          <div className="space-y-1">
            <Label>Manual-mode ranker page size</Label>
            <Input type="number" min={1} max={10} value={o.manual_mode_results ?? 5} onChange={e => setOutput('manual_mode_results', Number(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label>Max steps shown</Label>
            <Input type="number" min={3} max={12} value={o.max_steps_shown ?? 7} onChange={e => setOutput('max_steps_shown', Number(e.target.value))} />
          </div>
          <div className="flex items-end gap-2">
            <Switch id="div" checked={o.diversify_horseman !== false} onCheckedChange={v => setOutput('diversify_horseman', v)} />
            <Label htmlFor="div">Diversify by horseman in multi-plan</Label>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save engine config
      </Button>
    </div>
  );
}
