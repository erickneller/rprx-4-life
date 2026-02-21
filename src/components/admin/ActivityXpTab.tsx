import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface ActivityXpRow {
  id: string;
  display_name: string;
  description: string;
  base_xp: number;
  is_active: boolean;
  sort_order: number;
}

interface FormState {
  id: string;
  display_name: string;
  description: string;
  base_xp: number;
  is_active: boolean;
  sort_order: number;
}

const emptyForm: FormState = {
  id: '',
  display_name: '',
  description: '',
  base_xp: 0,
  is_active: true,
  sort_order: 0,
};

export function ActivityXpTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['admin-activity-xp-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_xp_config' as any)
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as unknown as ActivityXpRow[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: FormState) => {
      const { error } = await (supabase.from('activity_xp_config' as any) as any).upsert(
        {
          id: payload.id,
          display_name: payload.display_name,
          description: payload.description,
          base_xp: payload.base_xp,
          is_active: payload.is_active,
          sort_order: payload.sort_order,
        },
        { onConflict: 'id' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-activity-xp-config'] });
      queryClient.invalidateQueries({ queryKey: ['activity-xp-config'] });
      toast.success(editingId ? 'Activity XP updated' : 'Activity XP created');
      setDialogOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase.from('activity_xp_config' as any) as any)
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-activity-xp-config'] });
      queryClient.invalidateQueries({ queryKey: ['activity-xp-config'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (row: ActivityXpRow) => {
    setEditingId(row.id);
    setForm({
      id: row.id,
      display_name: row.display_name,
      description: row.description,
      base_xp: row.base_xp,
      is_active: row.is_active,
      sort_order: row.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.id || !form.display_name) {
      toast.error('ID and Display Name are required');
      return;
    }
    upsertMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Configure base XP awarded for each activity type. Changes take effect immediately.
        </p>
        <Button onClick={openCreate} size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> Add Activity
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center w-24">Base XP</TableHead>
              <TableHead className="text-center w-24">Active</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <div>
                    <span className="font-medium text-sm">{row.display_name}</span>
                    <span className="block text-xs text-muted-foreground font-mono">{row.id}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                  {row.description}
                </TableCell>
                <TableCell className="text-center font-semibold">{row.base_xp}</TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={row.is_active}
                    onCheckedChange={(checked) => toggleActive.mutate({ id: row.id, is_active: checked })}
                  />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Activity XP' : 'Add Activity XP'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the XP configuration for this activity.' : 'Define a new activity type and its XP reward.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Activity ID</Label>
              <Input
                value={form.id}
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                placeholder="e.g. strategy_completed"
                disabled={!!editingId}
              />
              <p className="text-xs text-muted-foreground mt-1">Must match the activity_type used in code</p>
            </div>
            <div>
              <Label>Display Name</Label>
              <Input
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                placeholder="e.g. Strategy Completed"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What triggers this activity"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Base XP</Label>
                <Input
                  type="number"
                  value={form.base_xp}
                  onChange={(e) => setForm((f) => ({ ...f, base_xp: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex-1">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, is_active: checked }))}
              />
              <Label>Active</Label>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
