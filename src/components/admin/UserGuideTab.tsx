import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserGuide, type UserGuideSection } from '@/hooks/useUserGuide';
import { exportUserGuidePDF } from '@/lib/userGuideExport';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Save, Trash2, Plus, Download } from 'lucide-react';
import { toast } from 'sonner';

export function UserGuideTab() {
  const { data: sections = [], isLoading } = useUserGuide();
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['user-guide-sections'] });

  const addSection = useMutation({
    mutationFn: async () => {
      const maxOrder = sections.reduce((max, s) => Math.max(max, s.sort_order), 0);
      const newId = `custom-${Date.now()}`;
      const { error } = await (supabase as any)
        .from('user_guide_sections')
        .insert({ id: newId, title: 'New Section', body: '', sort_order: maxOrder + 1 });
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Section added'); invalidate(); },
    onError: () => toast.error('Failed to add section'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('user_guide_sections')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Section deleted'); invalidate(); setDeleteId(null); },
    onError: () => toast.error('Failed to delete section'),
  });

  const handleDownloadPDF = () => {
    const activeSections = sections.filter(s => s.is_active);
    if (activeSections.length === 0) {
      toast.error('No active sections to export');
      return;
    }
    exportUserGuidePDF(activeSections);
    toast.success('PDF downloaded');
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold">User Guide</h2>
          <p className="text-sm text-muted-foreground">Edit the user manual sections. Active sections appear in the downloadable PDF.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-1">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
          <Button size="sm" onClick={() => addSection.mutate()} disabled={addSection.isPending} className="gap-1">
            <Plus className="h-4 w-4" /> Add Section
          </Button>
        </div>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {sections.map((section) => (
          <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2 text-left">
                <span className="font-medium">{section.title}</span>
                {!section.is_active && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Hidden</span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <SectionEditor section={section} onSaved={invalidate} onDelete={() => setDeleteId(section.id)} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete section?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this section from the user guide.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SectionEditor({ section, onSaved, onDelete }: { section: UserGuideSection; onSaved: () => void; onDelete: () => void }) {
  const [title, setTitle] = useState(section.title);
  const [body, setBody] = useState(section.body);
  const [isActive, setIsActive] = useState(section.is_active);
  const isDirty = title !== section.title || body !== section.body || isActive !== section.is_active;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any)
        .from('user_guide_sections')
        .update({ title, body, is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', section.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success(`"${title}" saved`); onSaved(); },
    onError: () => toast.error('Failed to save'),
  });

  return (
    <div className="space-y-3 pb-2">
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-1">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <Label htmlFor={`active-${section.id}`} className="text-sm">Active</Label>
          <Switch id={`active-${section.id}`} checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Body (Markdown)</Label>
        <Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} className="font-mono text-xs" />
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!isDirty || saveMutation.isPending} className="gap-1">
          <Save className="h-3 w-3" /> Save
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete} className="gap-1">
          <Trash2 className="h-3 w-3" /> Delete
        </Button>
      </div>
    </div>
  );
}
