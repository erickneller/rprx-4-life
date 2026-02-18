import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  description: string | null;
  updated_at: string;
}

function usePromptTemplates() {
  return useQuery({
    queryKey: ['prompt-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prompt_templates')
        .select('*')
        .order('id');
      if (error) throw error;
      return (data || []) as PromptTemplate[];
    },
  });
}

function useUpdatePromptTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content, name, description }: { id: string; content: string; name?: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const updates: Record<string, unknown> = { content, updated_at: new Date().toISOString() };
      if (user) updates.updated_by = user.id;
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      
      const { error } = await supabase
        .from('prompt_templates')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['prompt-templates'] });
    },
  });
}

export function PromptTemplatesTab() {
  const { data: templates = [], isLoading } = usePromptTemplates();
  const updateTemplate = useUpdatePromptTemplate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editName, setEditName] = useState('');
  const [confirmSaveId, setConfirmSaveId] = useState<string | null>(null);

  const startEditing = (template: PromptTemplate) => {
    setEditingId(template.id);
    setEditContent(template.content);
    setEditName(template.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
    setEditName('');
  };

  const handleSave = async () => {
    if (!confirmSaveId) return;
    try {
      await updateTemplate.mutateAsync({ id: confirmSaveId, content: editContent, name: editName });
      toast.success('Prompt template saved');
      setEditingId(null);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to save');
    }
    setConfirmSaveId(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const templateOrder = ['system_prompt', 'auto_mode_instructions', 'manual_mode_instructions'];
  const sortedTemplates = [...templates].sort((a, b) => {
    const ai = templateOrder.indexOf(a.id);
    const bi = templateOrder.indexOf(b.id);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Edit the AI prompt templates used by the Strategy Assistant. Changes take effect immediately for all new conversations.
      </p>

      {sortedTemplates.map((template) => {
        const isEditing = editingId === template.id;
        return (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  {isEditing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="font-semibold text-lg h-auto py-1"
                    />
                  ) : (
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  )}
                  <CardDescription className="mt-1">
                    {template.description || template.id}
                    <span className="ml-2 text-xs opacity-60">
                      Last updated: {new Date(template.updated_at).toLocaleString()}
                    </span>
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => startEditing(template)}>
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-3">
                  <Label>Prompt Content</Label>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={18}
                    className="font-mono text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={cancelEditing}>
                      <RotateCcw className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setConfirmSaveId(template.id)}
                      disabled={updateTemplate.isPending}
                    >
                      {updateTemplate.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-4 rounded-md max-h-48 overflow-y-auto font-mono">
                  {template.content.substring(0, 500)}{template.content.length > 500 ? '...' : ''}
                </pre>
              )}
            </CardContent>
          </Card>
        );
      })}

      {templates.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">
          No prompt templates found. They will be created automatically.
        </p>
      )}

      <AlertDialog open={!!confirmSaveId} onOpenChange={(open) => !open && setConfirmSaveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Prompt Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the AI prompt immediately for all new conversations. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>Save Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
