import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWizardContent, type WizardStepContent } from '@/hooks/useWizardContent';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const STEP_LABELS: Record<string, string> = {
  wizard_step_1: 'Step 1 — Financial Snapshot',
  wizard_step_2: 'Step 2 — Your Situation',
  wizard_step_3: 'Step 3 — Retirement Picture',
  wizard_step_4: 'Step 4 — Money Mindset',
  wizard_complete: 'Completion Screen',
};

export function WizardCopyTab() {
  const { data: rows = [], isLoading } = useWizardContent();
  const qc = useQueryClient();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Wizard Copy</h2>
        <p className="text-sm text-muted-foreground">Edit title and subtitle for each wizard step. Changes reflect immediately.</p>
      </div>
      <div className="space-y-4">
        {rows.map((row) => (
          <WizardCopyRow key={row.id} row={row} onSaved={() => qc.invalidateQueries({ queryKey: ['wizard-step-content'] })} />
        ))}
      </div>
    </div>
  );
}

function WizardCopyRow({ row, onSaved }: { row: WizardStepContent; onSaved: () => void }) {
  const [title, setTitle] = useState(row.title);
  const [subtitle, setSubtitle] = useState(row.subtitle);
  const isDirty = title !== row.title || subtitle !== row.subtitle;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('wizard_step_content')
        .update({ title, subtitle })
        .eq('id', row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${STEP_LABELS[row.id] || row.id} saved`);
      onSaved();
    },
    onError: () => toast.error('Failed to save'),
  });

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <p className="text-sm font-semibold text-muted-foreground">{STEP_LABELS[row.id] || row.id}</p>
      <div className="space-y-1">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label>Subtitle</Label>
        <Textarea rows={2} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      </div>
      <Button size="sm" onClick={() => saveMutation.mutate()} disabled={!isDirty || saveMutation.isPending} className="gap-1">
        <Save className="h-3 w-3" /> Save
      </Button>
    </div>
  );
}
