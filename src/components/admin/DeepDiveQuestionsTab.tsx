import { useState } from 'react';
import { useAdminDeepDiveQuestions, useCreateDeepDiveQuestion, useUpdateDeepDiveQuestion, useDeleteDeepDiveQuestion, type DeepDiveQuestionRow, type DeepDiveQuestionInsert } from '@/hooks/useAdminQuestions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const HORSEMAN_TYPES = ['interest', 'taxes', 'insurance', 'education'];

const emptyForm = {
  horseman_type: 'taxes', question_text: '', question_type: 'single_choice',
  order_index: 0, optionsStr: '[]',
};

const horsemanColor = (h: string) => {
  const map: Record<string, string> = {
    interest: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    taxes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    insurance: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    education: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  };
  return map[h] || '';
};

export function DeepDiveQuestionsTab() {
  const { data: questions = [], isLoading } = useAdminDeepDiveQuestions();
  const createQ = useCreateDeepDiveQuestion();
  const updateQ = useUpdateDeepDiveQuestion();
  const deleteQ = useDeleteDeepDiveQuestion();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [filterHorseman, setFilterHorseman] = useState<string>('all');

  const filtered = filterHorseman === 'all' ? questions : questions.filter(q => q.horseman_type === filterHorseman);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (row: DeepDiveQuestionRow) => {
    setEditingId(row.id);
    setForm({
      horseman_type: row.horseman_type, question_text: row.question_text,
      question_type: row.question_type, order_index: row.order_index,
      optionsStr: JSON.stringify(row.options, null, 2),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.question_text) { toast.error('Question text required'); return; }
    let options;
    try { options = JSON.parse(form.optionsStr); } catch { toast.error('Invalid options JSON'); return; }
    try {
      const payload = {
        horseman_type: form.horseman_type, question_text: form.question_text,
        question_type: form.question_type, order_index: form.order_index, options,
      };
      if (editingId) {
        await updateQ.mutateAsync({ ...payload, id: editingId });
        toast.success('Question updated');
      } else {
        await createQ.mutateAsync(payload as DeepDiveQuestionInsert);
        toast.success('Question created');
      }
      setDialogOpen(false);
    } catch (err: unknown) { toast.error((err as Error).message); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteQ.mutateAsync(deleteId); toast.success('Question deleted'); }
    catch (err: unknown) { toast.error((err as Error).message); }
    setDeleteId(null);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select value={filterHorseman} onValueChange={setFilterHorseman}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by Horseman" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Horsemen</SelectItem>
            {HORSEMAN_TYPES.map(h => <SelectItem key={h} value={h}>{h.charAt(0).toUpperCase() + h.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={openCreate} className="gap-1"><Plus className="h-4 w-4" /> Add Question</Button>
      </div>
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Horseman</TableHead>
              <TableHead className="w-16">Order</TableHead>
              <TableHead>Question Text</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(q => (
              <TableRow key={q.id}>
                <TableCell><Badge variant="secondary" className={horsemanColor(q.horseman_type)}>{q.horseman_type}</Badge></TableCell>
                <TableCell className="font-mono">{q.order_index}</TableCell>
                <TableCell className="max-w-[350px] truncate">{q.question_text}</TableCell>
                <TableCell className="text-sm">{q.question_type}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(q)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No questions found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Deep Dive Question' : 'Add Deep Dive Question'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Horseman Type</Label>
                <Select value={form.horseman_type} onValueChange={v => setForm(f => ({ ...f, horseman_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{HORSEMAN_TYPES.map(h => <SelectItem key={h} value={h}>{h.charAt(0).toUpperCase() + h.slice(1)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Question Type</Label><Input value={form.question_type} onChange={e => setForm(f => ({ ...f, question_type: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Question Text</Label><Textarea rows={3} value={form.question_text} onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Order Index</Label><Input type="number" value={form.order_index} onChange={e => setForm(f => ({ ...f, order_index: parseInt(e.target.value) || 0 }))} /></div>
            <div className="space-y-1"><Label>Options (JSON array)</Label><Textarea rows={4} className="font-mono text-xs" value={form.optionsStr} onChange={e => setForm(f => ({ ...f, optionsStr: e.target.value }))} /></div>
            <Button className="w-full" onClick={handleSave} disabled={createQ.isPending || updateQ.isPending}>
              {(createQ.isPending || updateQ.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingId ? 'Update Question' : 'Create Question'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this deep dive question.</AlertDialogDescription>
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
