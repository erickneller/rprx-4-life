import { useState } from 'react';
import { useAdminBadges, useCreateBadge, useUpdateBadge, useDeleteBadge, type BadgeRow, type BadgeInsert } from '@/hooks/useAdminBadges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const emptyForm: BadgeInsert = {
  id: '', name: '', description: '', icon: '🏆', category: 'milestone',
  trigger_type: 'manual', points: 10, sort_order: 0, is_active: true,
};

export function BadgesTab() {
  const { data: badges = [], isLoading } = useAdminBadges();
  const createBadge = useCreateBadge();
  const updateBadge = useUpdateBadge();
  const deleteBadge = useDeleteBadge();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BadgeInsert>(emptyForm);
  const [triggerValueStr, setTriggerValueStr] = useState('');

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setTriggerValueStr('');
    setDialogOpen(true);
  };

  const openEdit = (row: BadgeRow) => {
    setEditingId(row.id);
    setForm({
      id: row.id, name: row.name, description: row.description, icon: row.icon,
      category: row.category, trigger_type: row.trigger_type, points: row.points,
      sort_order: row.sort_order, is_active: row.is_active,
    });
    setTriggerValueStr(row.trigger_value ? JSON.stringify(row.trigger_value, null, 2) : '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.id || !form.name) { toast.error('ID and Name are required'); return; }
    let trigger_value = null;
    if (triggerValueStr.trim()) {
      try { trigger_value = JSON.parse(triggerValueStr); } catch { toast.error('Invalid trigger_value JSON'); return; }
    }
    try {
      const payload = { ...form, trigger_value };
      if (editingId) {
        await updateBadge.mutateAsync({ ...payload, id: editingId });
        toast.success('Badge updated');
      } else {
        await createBadge.mutateAsync(payload);
        toast.success('Badge created');
      }
      setDialogOpen(false);
    } catch (err: unknown) { toast.error((err as Error).message); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteBadge.mutateAsync(deleteId); toast.success('Badge deleted'); }
    catch (err: unknown) { toast.error((err as Error).message); }
    setDeleteId(null);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="gap-1"><Plus className="h-4 w-4" /> Add Badge</Button>
      </div>
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Icon</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Points</TableHead>
              <TableHead className="w-20">Active</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {badges.map(b => (
              <TableRow key={b.id}>
                <TableCell className="text-xl">{b.icon}</TableCell>
                <TableCell className="font-mono text-xs">{b.id}</TableCell>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell><Badge variant="secondary">{b.category}</Badge></TableCell>
                <TableCell className="text-sm">{b.trigger_type}</TableCell>
                <TableCell>{b.points}</TableCell>
                <TableCell>
                  <Switch checked={b.is_active} onCheckedChange={(checked) => updateBadge.mutate({ id: b.id, is_active: checked })} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {badges.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No badges found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Badge' : 'Add Badge'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Badge ID</Label><Input value={form.id} disabled={!!editingId} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Icon (emoji)</Label><Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Category</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Trigger Type</Label><Input value={form.trigger_type} onChange={e => setForm(f => ({ ...f, trigger_type: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Trigger Value (JSON)</Label><Textarea rows={3} placeholder='{"count": 5}' value={triggerValueStr} onChange={e => setTriggerValueStr(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Points</Label><Input type="number" value={form.points} onChange={e => setForm(f => ({ ...f, points: parseInt(e.target.value) || 0 }))} /></div>
              <div className="space-y-1"><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={createBadge.isPending || updateBadge.isPending}>
              {(createBadge.isPending || updateBadge.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? 'Update Badge' : 'Create Badge'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Badge?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove badge "{deleteId}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
