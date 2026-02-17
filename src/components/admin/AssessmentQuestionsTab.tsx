import { useState } from 'react';
import { useAdminAssessmentQuestions, useCreateAssessmentQuestion, useUpdateAssessmentQuestion, useDeleteAssessmentQuestion, type AssessmentQuestionRow, type AssessmentQuestionInsert } from '@/hooks/useAdminQuestions';
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
import type { Database } from '@/integrations/supabase/types';

type QuestionType = Database['public']['Enums']['question_type'];
const QUESTION_TYPES: QuestionType[] = ['slider', 'single_choice', 'yes_no', 'range_select'];

const emptyForm = {
  question_text: '', question_type: 'single_choice' as QuestionType, category: '',
  order_index: 0, optionsStr: '[]', weightsStr: '{}',
};

export function AssessmentQuestionsTab() {
  const { data: questions = [], isLoading } = useAdminAssessmentQuestions();
  const createQ = useCreateAssessmentQuestion();
  const updateQ = useUpdateAssessmentQuestion();
  const deleteQ = useDeleteAssessmentQuestion();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (row: AssessmentQuestionRow) => {
    setEditingId(row.id);
    setForm({
      question_text: row.question_text, question_type: row.question_type,
      category: row.category, order_index: row.order_index,
      optionsStr: JSON.stringify(row.options, null, 2),
      weightsStr: JSON.stringify(row.horseman_weights, null, 2),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.question_text || !form.category) { toast.error('Question text and category required'); return; }
    let options, horseman_weights;
    try { options = JSON.parse(form.optionsStr); } catch { toast.error('Invalid options JSON'); return; }
    try { horseman_weights = JSON.parse(form.weightsStr); } catch { toast.error('Invalid horseman_weights JSON'); return; }
    try {
      const payload = {
        question_text: form.question_text, question_type: form.question_type,
        category: form.category, order_index: form.order_index, options, horseman_weights,
      };
      if (editingId) {
        await updateQ.mutateAsync({ ...payload, id: editingId });
        toast.success('Question updated');
      } else {
        await createQ.mutateAsync(payload as AssessmentQuestionInsert);
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
      <div className="flex justify-end">
        <Button onClick={openCreate} className="gap-1"><Plus className="h-4 w-4" /> Add Question</Button>
      </div>
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Order</TableHead>
              <TableHead>Question Text</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Weights</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map(q => (
              <TableRow key={q.id}>
                <TableCell className="font-mono">{q.order_index}</TableCell>
                <TableCell className="max-w-[300px] truncate">{q.question_text}</TableCell>
                <TableCell><Badge variant="secondary">{q.category}</Badge></TableCell>
                <TableCell className="text-sm">{q.question_type}</TableCell>
                <TableCell className="text-xs font-mono max-w-[150px] truncate">{JSON.stringify(q.horseman_weights)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(q)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {questions.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No questions found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? 'Edit Question' : 'Add Question'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1"><Label>Question Text</Label><Textarea rows={3} value={form.question_text} onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Category</Label><Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.question_type} onValueChange={v => setForm(f => ({ ...f, question_type: v as QuestionType }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{QUESTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1"><Label>Order Index</Label><Input type="number" value={form.order_index} onChange={e => setForm(f => ({ ...f, order_index: parseInt(e.target.value) || 0 }))} /></div>
            <div className="space-y-1"><Label>Options (JSON array)</Label><Textarea rows={4} className="font-mono text-xs" value={form.optionsStr} onChange={e => setForm(f => ({ ...f, optionsStr: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Horseman Weights (JSON object)</Label><Textarea rows={4} className="font-mono text-xs" value={form.weightsStr} onChange={e => setForm(f => ({ ...f, weightsStr: e.target.value }))} /></div>
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
            <AlertDialogDescription>This will permanently remove this assessment question.</AlertDialogDescription>
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
