import { useMemo, useState } from 'react';
import {
  useAdminSupportRequests,
  useUpdateSupportRequest,
  useDeleteSupportRequest,
  type SupportRequestRow,
  type SupportRequestStatus,
  type SupportRequestType,
} from '@/hooks/useSupportRequests';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Loader2, Save, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TYPE_LABEL: Record<SupportRequestType, string> = {
  help: 'Help', bug: 'Bug', feature: 'Feature', advisor: 'Advisor',
};
const TYPE_COLOR: Record<SupportRequestType, string> = {
  help: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  bug: 'bg-red-500/15 text-red-600 dark:text-red-400',
  feature: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  advisor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
};
const STATUSES: SupportRequestStatus[] = ['new', 'in_progress', 'resolved', 'archived'];

function Row({ row }: { row: SupportRequestRow }) {
  const update = useUpdateSupportRequest();
  const del = useDeleteSupportRequest();
  const [notes, setNotes] = useState(row.admin_notes || '');

  return (
    <AccordionItem value={row.id} className={cn('border rounded-md px-3', row.status === 'archived' && 'opacity-60')}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 flex-wrap text-left flex-1 min-w-0">
          <Badge className={cn('shrink-0', TYPE_COLOR[row.type])}>{TYPE_LABEL[row.type]}</Badge>
          <span className="font-medium truncate">{row.subject}</span>
          <Badge variant="outline" className="shrink-0 capitalize">{row.status.replace('_', ' ')}</Badge>
          <span className="text-xs text-muted-foreground ml-auto shrink-0">
            {row.full_name} · {new Date(row.created_at).toLocaleDateString()}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3 pt-2">
          <p className="text-sm whitespace-pre-wrap">{row.message}</p>
          {row.page_url && (
            <p className="text-xs text-muted-foreground break-all flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              <a href={row.page_url} target="_blank" rel="noreferrer" className="hover:underline">{row.page_url}</a>
            </p>
          )}
          {row.user_agent && <p className="text-xs text-muted-foreground break-all">{row.user_agent}</p>}

          <div className="space-y-2">
            <label className="text-xs font-medium">Admin notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={row.status}
              onValueChange={async (v) => {
                try {
                  await update.mutateAsync({ id: row.id, status: v as SupportRequestStatus });
                  toast.success('Status updated');
                } catch { toast.error('Failed'); }
              }}
            >
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={async () => {
                try {
                  await update.mutateAsync({ id: row.id, admin_notes: notes });
                  toast.success('Notes saved');
                } catch { toast.error('Failed'); }
              }}
            >
              <Save className="h-4 w-4" /> Save Notes
            </Button>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive gap-1"
              onClick={async () => {
                if (!confirm('Delete this request?')) return;
                try { await del.mutateAsync(row.id); toast.success('Deleted'); } catch { toast.error('Failed'); }
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function SupportRequestsTab() {
  const { data = [], isLoading } = useAdminSupportRequests();
  const [typeFilter, setTypeFilter] = useState<'all' | SupportRequestType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SupportRequestStatus>('all');

  const filtered = useMemo(() => {
    return data.filter(
      (r) => (typeFilter === 'all' || r.type === typeFilter) && (statusFilter === 'all' || r.status === statusFilter)
    );
  }, [data, typeFilter, statusFilter]);

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.keys(TYPE_LABEL) as SupportRequestType[]).map((t) => (
              <SelectItem key={t} value={t}>{TYPE_LABEL[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">{filtered.length} request{filtered.length === 1 ? '' : 's'}</span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No support requests.</p>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {filtered.map((row) => <Row key={row.id} row={row} />)}
        </Accordion>
      )}
    </div>
  );
}
