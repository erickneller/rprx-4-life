import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useKnowledgeBase, useCreateKBEntry, useUpdateKBEntry, useDeleteKBEntry, useSyncKBEntry } from '@/hooks/useKnowledgeBase';
import { toast } from 'sonner';
import { Plus, RefreshCw, Trash2, Pencil, Loader2, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function KnowledgeBaseTab() {
  const { data: entries = [], isLoading } = useKnowledgeBase();
  const createEntry = useCreateKBEntry();
  const updateEntry = useUpdateKBEntry();
  const deleteEntry = useDeleteKBEntry();
  const syncEntry = useSyncKBEntry();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [syncAllLoading, setSyncAllLoading] = useState(false);

  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUrl, setFormUrl] = useState('');

  const openCreate = () => {
    setEditingId(null);
    setFormId('');
    setFormName('');
    setFormDescription('');
    setFormUrl('');
    setDialogOpen(true);
  };

  const openEdit = (entry: typeof entries[0]) => {
    setEditingId(entry.id);
    setFormId(entry.id);
    setFormName(entry.name);
    setFormDescription(entry.description);
    setFormUrl(entry.source_url);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formId.trim() || !formName.trim()) {
      toast.error('ID and Name are required');
      return;
    }
    try {
      if (editingId) {
        await updateEntry.mutateAsync({ id: editingId, name: formName, description: formDescription, source_url: formUrl });
        toast.success('Document updated');
      } else {
        await createEntry.mutateAsync({ id: formId.trim(), name: formName.trim(), description: formDescription, source_url: formUrl });
        toast.success('Document added');
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEntry.mutateAsync(deleteId);
      toast.success('Document deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    }
    setDeleteId(null);
  };

  const handleSync = async (id: string, source_url: string) => {
    if (!source_url) {
      toast.error('No source URL configured for this document');
      return;
    }
    setSyncingIds(prev => new Set(prev).add(id));
    try {
      const result = await syncEntry.mutateAsync({ id, source_url });
      toast.success(`Synced ${result.chars?.toLocaleString() || ''} characters`);
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    }
    setSyncingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleSyncAll = async () => {
    const active = entries.filter(e => e.is_active && e.source_url);
    if (active.length === 0) {
      toast.error('No active documents with source URLs');
      return;
    }
    setSyncAllLoading(true);
    let success = 0;
    let failed = 0;
    for (const entry of active) {
      try {
        await syncEntry.mutateAsync({ id: entry.id, source_url: entry.source_url });
        success++;
      } catch {
        failed++;
      }
    }
    setSyncAllLoading(false);
    toast.success(`Synced ${success} document(s)${failed > 0 ? `, ${failed} failed` : ''}`);
  };

  const handleToggleActive = async (id: string, checked: boolean) => {
    try {
      await updateEntry.mutateAsync({ id, is_active: checked });
      toast.success(checked ? 'Document activated' : 'Document deactivated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Knowledge Base Documents</CardTitle>
              <CardDescription>
                Link Google Docs to inject as AI context. Docs must be shared as "Anyone with the link can view".
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSyncAll} disabled={syncAllLoading}>
                {syncAllLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Sync All
              </Button>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" /> Add Document
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No documents yet. Click "Add Document" to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Last Synced</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      <div>{entry.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{entry.id}</div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{entry.description}</TableCell>
                    <TableCell className="text-sm">
                      {entry.last_synced_at ? formatDistanceToNow(new Date(entry.last_synced_at), { addSuffix: true }) : <span className="text-muted-foreground">Never</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.content ? `${entry.content.length.toLocaleString()} chars` : '—'}
                    </TableCell>
                    <TableCell>
                      <Switch checked={entry.is_active} onCheckedChange={(c) => handleToggleActive(entry.id, c)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {entry.source_url && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={entry.source_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSync(entry.id, entry.source_url)}
                          disabled={syncingIds.has(entry.id)}
                        >
                          {syncingIds.has(entry.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(entry.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Document' : 'Add Document'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ID (slug)</Label>
              <Input value={formId} onChange={e => setFormId(e.target.value)} disabled={!!editingId} placeholder="e.g. four-horsemen-guide" />
            </div>
            <div>
              <Label>Name</Label>
              <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Four Horsemen Guide" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="What this document covers..." rows={2} />
            </div>
            <div>
              <Label>Google Doc URL</Label>
              <Input value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="https://docs.google.com/document/d/..." />
            </div>
            <Button onClick={handleSave} disabled={createEntry.isPending || updateEntry.isPending} className="w-full">
              {(createEntry.isPending || updateEntry.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editingId ? 'Update' : 'Add'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete document?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this knowledge base entry and its synced content.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
