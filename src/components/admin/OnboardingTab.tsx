import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface OnboardingRow {
  id: string;
  day_number: number;
  phase: string;
  horseman_type: string;
  content_type: string;
  title: string;
  body: string;
  action_text: string | null;
  action_type: string | null;
  action_target: string | null;
  quiz_data: unknown;
  points_reward: number;
  estimated_minutes: number;
  is_active: boolean;
}

const PHASES = ['clarity', 'awareness', 'second_win', 'identity', 'vision'];
const CONTENT_TYPES = ['micro_lesson', 'action_prompt', 'quiz', 'reflection', 'milestone'];
const HORSEMAN_TYPES = ['universal', 'interest', 'taxes', 'insurance', 'education'];

export function OnboardingTab() {
  const qc = useQueryClient();
  const [editRow, setEditRow] = useState<OnboardingRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['admin-onboarding-content'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('onboarding_content')
        .select('*')
        .order('day_number')
        .order('horseman_type');
      if (error) throw error;
      return (data || []) as OnboardingRow[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<OnboardingRow> }) => {
      const { error } = await (supabase as any)
        .from('onboarding_content')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-onboarding-content'] });
      toast.success('Content updated');
    },
  });

  const insertMutation = useMutation({
    mutationFn: async (row: Partial<OnboardingRow>) => {
      const { error } = await (supabase as any)
        .from('onboarding_content')
        .insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-onboarding-content'] });
      toast.success('Content added');
      setDialogOpen(false);
    },
  });

  const openCreate = () => {
    setEditRow({
      id: '',
      day_number: 1,
      phase: 'clarity',
      horseman_type: 'universal',
      content_type: 'micro_lesson',
      title: '',
      body: '',
      action_text: null,
      action_type: null,
      action_target: null,
      quiz_data: null,
      points_reward: 5,
      estimated_minutes: 3,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (row: OnboardingRow) => {
    setEditRow({ ...row });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editRow) return;
    if (editRow.id) {
      const { id, ...updates } = editRow;
      updateMutation.mutate({ id, updates });
      setDialogOpen(false);
    } else {
      const { id, ...rest } = editRow;
      insertMutation.mutate(rest);
    }
  };

  const phaseColor = (p: string) => {
    const map: Record<string, string> = {
      clarity: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      awareness: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      second_win: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      identity: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      vision: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
    };
    return map[p] || '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Onboarding Content</h2>
          <p className="text-sm text-muted-foreground">Manage 30-day onboarding journey content.</p>
        </div>
        <Button onClick={openCreate} className="gap-1">
          <Plus className="h-4 w-4" /> Add Content
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">Day</TableHead>
                <TableHead className="w-24">Phase</TableHead>
                <TableHead className="w-20">Horseman</TableHead>
                <TableHead className="w-24">Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-16">Points</TableHead>
                <TableHead className="w-16">Active</TableHead>
                <TableHead className="w-14">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-sm">{r.day_number}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={phaseColor(r.phase)}>{r.phase}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{r.horseman_type}</TableCell>
                  <TableCell className="text-xs">{r.content_type}</TableCell>
                  <TableCell className="font-medium text-sm max-w-[200px] truncate">{r.title}</TableCell>
                  <TableCell className="text-sm">{r.points_reward}</TableCell>
                  <TableCell>
                    <Switch
                      checked={r.is_active}
                      onCheckedChange={(checked) => updateMutation.mutate({ id: r.id, updates: { is_active: checked } })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editRow?.id ? 'Edit Content' : 'Add Content'}</DialogTitle>
          </DialogHeader>
          {editRow && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Day</Label>
                  <Input type="number" min={1} max={30} value={editRow.day_number} onChange={e => setEditRow({ ...editRow, day_number: parseInt(e.target.value) || 1 })} />
                </div>
                <div className="space-y-1">
                  <Label>Phase</Label>
                  <Select value={editRow.phase} onValueChange={v => setEditRow({ ...editRow, phase: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PHASES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Horseman</Label>
                  <Select value={editRow.horseman_type} onValueChange={v => setEditRow({ ...editRow, horseman_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{HORSEMAN_TYPES.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Content Type</Label>
                <Select value={editRow.content_type} onValueChange={v => setEditRow({ ...editRow, content_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Title</Label>
                <Input value={editRow.title} onChange={e => setEditRow({ ...editRow, title: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Body (Markdown)</Label>
                <Textarea rows={6} value={editRow.body} onChange={e => setEditRow({ ...editRow, body: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Action Text</Label>
                  <Input value={editRow.action_text || ''} onChange={e => setEditRow({ ...editRow, action_text: e.target.value || null })} />
                </div>
                <div className="space-y-1">
                  <Label>Action Target</Label>
                  <Input value={editRow.action_target || ''} onChange={e => setEditRow({ ...editRow, action_target: e.target.value || null })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Points Reward</Label>
                  <Input type="number" value={editRow.points_reward} onChange={e => setEditRow({ ...editRow, points_reward: parseInt(e.target.value) || 5 })} />
                </div>
                <div className="space-y-1">
                  <Label>Est. Minutes</Label>
                  <Input type="number" value={editRow.estimated_minutes} onChange={e => setEditRow({ ...editRow, estimated_minutes: parseInt(e.target.value) || 3 })} />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full" disabled={updateMutation.isPending || insertMutation.isPending}>
                {editRow.id ? 'Save Changes' : 'Add Content'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
