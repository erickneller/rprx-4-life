import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Row = {
  ghl_product_id: string;
  tier: 'partner' | 'pro';
  billing_interval: 'month' | 'year';
  is_active: boolean;
  notes: string | null;
};

export function GhlProductMapTab() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['ghl-product-tier-map'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('ghl_product_tier_map') as any)
        .select('*').order('tier').order('billing_interval');
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const [form, setForm] = useState<Row>({
    ghl_product_id: '',
    tier: 'partner',
    billing_interval: 'month',
    is_active: true,
    notes: '',
  });

  const save = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await (supabase.from('ghl_product_tier_map') as any)
        .upsert(row, { onConflict: 'ghl_product_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Saved');
      qc.invalidateQueries({ queryKey: ['ghl-product-tier-map'] });
      setForm({ ghl_product_id: '', tier: 'partner', billing_interval: 'month', is_active: true, notes: '' });
    },
    onError: (e: any) => toast.error(e.message ?? 'Save failed'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('ghl_product_tier_map') as any)
        .delete().eq('ghl_product_id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Deleted');
      qc.invalidateQueries({ queryKey: ['ghl-product-tier-map'] });
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase.from('ghl_product_tier_map') as any)
        .update({ is_active }).eq('ghl_product_id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ghl-product-tier-map'] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">GHL Product → Tier Mapping</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Map GoHighLevel product IDs to RPRx subscription tiers. The ghl-checkout-webhook
          uses this table to know which tier to grant when a GHL purchase fires.
        </p>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2 space-y-1">
            <Label>GHL Product ID</Label>
            <Input
              placeholder="e.g. 6650f0..."
              value={form.ghl_product_id}
              onChange={(e) => setForm(f => ({ ...f, ghl_product_id: e.target.value.trim() }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Tier</Label>
            <Select value={form.tier} onValueChange={(v) => setForm(f => ({ ...f, tier: v as Row['tier'] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="partner">Partner</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Interval</Label>
            <Select value={form.billing_interval} onValueChange={(v) => setForm(f => ({ ...f, billing_interval: v as Row['billing_interval'] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button
              className="w-full"
              disabled={!form.ghl_product_id || save.isPending}
              onClick={() => save.mutate(form)}
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          <Label>Notes (optional)</Label>
          <Input
            placeholder="Internal notes"
            value={form.notes ?? ''}
            onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product ID</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Interval</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6"><Loader2 className="inline h-4 w-4 animate-spin" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No products mapped yet.</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.ghl_product_id}>
                <TableCell className="font-mono text-xs">{r.ghl_product_id}</TableCell>
                <TableCell className="capitalize">{r.tier}</TableCell>
                <TableCell className="capitalize">{r.billing_interval}</TableCell>
                <TableCell>
                  <Switch checked={r.is_active} onCheckedChange={(v) => toggle.mutate({ id: r.ghl_product_id, is_active: v })} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.notes}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(r.ghl_product_id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4 bg-muted/30">
        <p className="text-sm font-medium mb-2">Webhook endpoint (paste into GHL workflows)</p>
        <code className="text-xs block break-all bg-background p-2 rounded border">
          https://wkzgjvnpnhyluxvclymh.supabase.co/functions/v1/ghl-checkout-webhook
        </code>
        <p className="text-xs text-muted-foreground mt-2">
          Add header <code>X-Webhook-Secret</code> with the value of <code>GHL_CHECKOUT_WEBHOOK_SECRET</code>.
          JSON body must include: <code>event_type</code>, <code>email</code>, <code>product_id</code>,
          <code> subscription_id</code>, <code>contact_id</code>, <code>current_period_end</code>.
        </p>
      </Card>
    </div>
  );
}
