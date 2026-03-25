import { useState, useMemo } from 'react';
import { useAdminFeedback, useArchiveFeedback, useDeleteFeedback, useBulkDeleteArchivedFeedback, type FeedbackRow } from '@/hooks/usePageFeedback';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Download, Trash2, Archive, ArchiveRestore, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function FeedbackTab() {
  const { data: feedback = [], isLoading } = useAdminFeedback();
  const archiveMutation = useArchiveFeedback();
  const deleteMutation = useDeleteFeedback();
  const bulkDeleteArchived = useBulkDeleteArchivedFeedback();
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');

  const filtered = useMemo(() => {
    if (filter === 'active') return feedback.filter(f => !f.archived);
    if (filter === 'archived') return feedback.filter(f => f.archived);
    return feedback;
  }, [feedback, filter]);

  const grouped = useMemo(() => {
    const map: Record<string, FeedbackRow[]> = {};
    for (const f of filtered) {
      (map[f.page_route] ||= []).push(f);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const avgRating = (rows: FeedbackRow[]) => {
    const sum = rows.reduce((s, r) => s + r.rating, 0);
    return (sum / rows.length).toFixed(1);
  };

  const renderStars = (rating: number) => (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={cn('h-3.5 w-3.5', s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground')} />
      ))}
    </span>
  );

  const handleExportCSV = () => {
    const escape = (v: string) => v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"` : v;
    const headers = ['page_route', 'user', 'rating', 'comment', 'date', 'archived'];
    const lines = [headers.join(',')];
    for (const f of filtered) {
      lines.push([
        escape(f.page_route),
        escape(f.full_name || 'Unknown'),
        String(f.rating),
        escape(f.comment || ''),
        new Date(f.created_at).toISOString(),
        String(f.archived),
      ].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `page-feedback-${filter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} feedback items`);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filtered.length === 0} className="gap-1">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={async () => {
            try {
              await bulkDeleteArchived.mutateAsync();
              toast.success('Archived feedback deleted');
            } catch { toast.error('Failed to delete'); }
          }}
          disabled={bulkDeleteArchived.isPending || feedback.filter(f => f.archived).length === 0}
          className="gap-1"
        >
          <Trash2 className="h-4 w-4" /> Delete Archived
        </Button>
      </div>

      {grouped.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No feedback yet.</p>
      )}

      <Accordion type="multiple" className="space-y-2">
        {grouped.map(([route, rows]) => (
          <AccordionItem key={route} value={route} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <span className="font-medium">{route}</span>
                <Badge variant="secondary">{rows.length}</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  {renderStars(Math.round(Number(avgRating(rows))))} {avgRating(rows)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {rows.map(row => (
                  <div key={row.id} className={cn('flex items-start gap-3 p-3 rounded-md border', row.archived && 'opacity-60 bg-muted/30')}>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{row.full_name}</span>
                        {renderStars(row.rating)}
                        <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span>
                        {row.archived && <Badge variant="outline" className="text-xs">Archived</Badge>}
                      </div>
                      {row.comment && <p className="text-sm text-muted-foreground">{row.comment}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={async () => {
                          try {
                            await archiveMutation.mutateAsync({ id: row.id, archived: !row.archived });
                            toast.success(row.archived ? 'Unarchived' : 'Archived');
                          } catch { toast.error('Failed'); }
                        }}
                      >
                        {row.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={async () => {
                          try {
                            await deleteMutation.mutateAsync(row.id);
                            toast.success('Deleted');
                          } catch { toast.error('Failed'); }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
