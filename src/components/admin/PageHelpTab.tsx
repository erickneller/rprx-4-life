import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2, Video } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { PageHelpContent } from '@/hooks/usePageHelp';

interface FormState {
  id: string;
  page_name: string;
  hint_text: string;
  help_title: string;
  help_body: string;
  video_url: string;
  video_placeholder_text: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  id: '', page_name: '', hint_text: '', help_title: '', help_body: '',
  video_url: '', video_placeholder_text: 'Video tutorial coming soon', is_active: true,
};

export function PageHelpTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-page-help'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_help_content' as any)
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as PageHelpContent[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: FormState) => {
      const row = {
        id: payload.id,
        page_name: payload.page_name,
        hint_text: payload.hint_text,
        help_title: payload.help_title,
        help_body: payload.help_body,
        video_url: payload.video_url || null,
        video_placeholder_text: payload.video_placeholder_text,
        is_active: payload.is_active,
      };
      const { error } = await supabase
        .from('page_help_content' as any)
        .upsert(row as any, { onConflict: 'id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-page-help'] });
      queryClient.invalidateQueries({ queryKey: ['page-help'] });
      setDialogOpen(false);
      toast.success(editingId ? 'Page help updated' : 'Page help created');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('page_help_content' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-page-help'] });
      queryClient.invalidateQueries({ queryKey: ['page-help'] });
      toast.success('Page help deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('page_help_content' as any)
        .update({ is_active } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-page-help'] });
      queryClient.invalidateQueries({ queryKey: ['page-help'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (item: PageHelpContent) => {
    setEditingId(item.id);
    setForm({
      id: item.id, page_name: item.page_name, hint_text: item.hint_text,
      help_title: item.help_title, help_body: item.help_body,
      video_url: item.video_url || '', video_placeholder_text: item.video_placeholder_text,
      is_active: item.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.id || !form.page_name || !form.help_title) {
      toast.error('ID, Page Name, and Help Title are required');
      return;
    }
    upsertMutation.mutate(form);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Page Help Content</h2>
          <p className="text-sm text-muted-foreground">Manage the help instructions shown on each page.</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Add Page</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Page Name</TableHead>
            <TableHead>Hint Text</TableHead>
            <TableHead className="w-20 text-center">Video</TableHead>
            <TableHead className="w-20 text-center">Active</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.page_name}</TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{item.hint_text}</TableCell>
              <TableCell className="text-center">
                {item.video_url ? <Video className="h-4 w-4 text-primary mx-auto" /> : <span className="text-muted-foreground/40">—</span>}
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={item.is_active}
                  onCheckedChange={(checked) => toggleActive.mutate({ id: item.id, is_active: checked })}
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No page help content yet.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      {/* Edit/Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Page Help' : 'Add Page Help'}</DialogTitle>
            <DialogDescription>Configure the help content for a page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Page ID (route key)</Label>
              <Input value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} disabled={!!editingId} placeholder="e.g. dashboard" />
            </div>
            <div>
              <Label>Page Name</Label>
              <Input value={form.page_name} onChange={e => setForm(f => ({ ...f, page_name: e.target.value }))} placeholder="e.g. Dashboard" />
            </div>
            <div>
              <Label>Hint Text</Label>
              <Input value={form.hint_text} onChange={e => setForm(f => ({ ...f, hint_text: e.target.value }))} placeholder="One-line teaser shown next to help button" />
            </div>
            <div>
              <Label>Help Title</Label>
              <Input value={form.help_title} onChange={e => setForm(f => ({ ...f, help_title: e.target.value }))} placeholder="Title shown in help drawer" />
            </div>
            <div>
              <Label>Help Body (Markdown)</Label>
              <Textarea value={form.help_body} onChange={e => setForm(f => ({ ...f, help_body: e.target.value }))} rows={8} placeholder="Supports **bold**, ## headings, - bullets, [links](url)" />
            </div>
            <div>
              <Label>Video URL (optional)</Label>
              <Input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="YouTube, Vimeo, or direct video URL" />
            </div>
            <div>
              <Label>Video Placeholder Text</Label>
              <Input value={form.video_placeholder_text} onChange={e => setForm(f => ({ ...f, video_placeholder_text: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={checked => setForm(f => ({ ...f, is_active: checked }))} />
              <Label>Active</Label>
            </div>
            <Button onClick={handleSave} disabled={upsertMutation.isPending} className="w-full">
              {upsertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {editingId ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete page help?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove help content for this page.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { deleteMutation.mutate(deleteId); setDeleteId(null); } }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
