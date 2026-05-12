import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Save, Play, Download, FileText, FileType } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { downloadGhlSpecCsv, downloadGhlSpecMarkdown } from '@/lib/ghlFieldSpecExport';

type Mapping = {
  id: string;
  profile_field: string;
  ghl_target_type: 'standard' | 'custom_field' | 'tag';
  ghl_field_key: string;
  transform: string;
  is_active: boolean;
  sort_order: number;
  notes: string | null;
};

const TRANSFORMS = ['none', 'split_first_name', 'split_last_name', 'join_comma', 'boolean_yesno', 'number', 'lowercase'];
const TARGET_TYPES = ['standard', 'custom_field', 'tag'];
const STANDARD_KEYS = ['firstName', 'lastName', 'name', 'email', 'phone', 'companyName', 'address1', 'city', 'state', 'postalCode', 'country', 'website', 'dateOfBirth'];

export function GHLFieldMappingTab() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Record<string, Partial<Mapping>>>({});
  const [previewJson, setPreviewJson] = useState<string | null>(null);

  const { data: mappings = [], isLoading } = useQuery({
    queryKey: ['ghl-field-mappings'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('ghl_field_mappings') as any)
        .select('*').order('sort_order');
      if (error) throw error;
      return (data ?? []) as Mapping[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (row: Partial<Mapping>) => {
      const payload = { ...row };
      const { error } = await (supabase.from('ghl_field_mappings') as any).upsert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ghl-field-mappings'] });
      toast.success('Mapping saved');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('ghl_field_mappings') as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ghl-field-mappings'] });
      toast.success('Mapping removed');
    },
  });

  const addRow = () => {
    upsert.mutate({
      profile_field: 'full_name',
      ghl_target_type: 'custom_field',
      ghl_field_key: 'new_field_key',
      transform: 'none',
      is_active: true,
      sort_order: (mappings[mappings.length - 1]?.sort_order ?? 0) + 10,
    });
  };

  const updateRow = (id: string, patch: Partial<Mapping>) => {
    setDraft((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
  };
  const saveRow = (row: Mapping) => {
    const merged = { ...row, ...(draft[row.id] ?? {}) };
    upsert.mutate(merged);
    setDraft((d) => { const n = { ...d }; delete n[row.id]; return n; });
  };
  const toggleActive = (row: Mapping, val: boolean) => {
    upsert.mutate({ ...row, is_active: val });
  };

  const runTest = async () => {
    setPreviewJson('Running...');
    const { data, error } = await supabase.functions.invoke('ghl-sync', { body: { dryRun: true } });
    if (error) {
      setPreviewJson(`Error: ${error.message}`);
      toast.error(error.message);
      return;
    }
    setPreviewJson(JSON.stringify(data, null, 2));
    toast.success('Dry-run preview generated');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>GHL Field Mapping</CardTitle>
          <CardDescription>
            Configure how profile fields sync to GoHighLevel contacts. Standard fields map to native GHL contact fields,
            custom fields use the custom-field <em>key</em> you set up in GHL, and tags are added to the contact.
            For tag rows, use a template like <code>horseman:{'{value}'}</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={addRow} size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add mapping</Button>
            <Button onClick={runTest} size="sm" variant="secondary"><Play className="h-4 w-4 mr-1" /> Test sync (dry run, my user)</Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile field</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>GHL key / template</TableHead>
                  <TableHead>Transform</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={7} className="text-muted-foreground">Loading...</TableCell></TableRow>}
                {mappings.map((row) => {
                  const d = draft[row.id] ?? {};
                  const cur = { ...row, ...d };
                  const dirty = !!draft[row.id];
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Input value={cur.profile_field} onChange={(e) => updateRow(row.id, { profile_field: e.target.value })} className="h-8" />
                      </TableCell>
                      <TableCell>
                        <Select value={cur.ghl_target_type} onValueChange={(v) => updateRow(row.id, { ghl_target_type: v as any })}>
                          <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TARGET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {cur.ghl_target_type === 'standard' ? (
                          <Select value={cur.ghl_field_key} onValueChange={(v) => updateRow(row.id, { ghl_field_key: v })}>
                            <SelectTrigger className="h-8 w-[180px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STANDARD_KEYS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input value={cur.ghl_field_key} onChange={(e) => updateRow(row.id, { ghl_field_key: e.target.value })} className="h-8" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Select value={cur.transform} onValueChange={(v) => updateRow(row.id, { transform: v })}>
                          <SelectTrigger className="h-8 w-[160px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TRANSFORMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={cur.sort_order} onChange={(e) => updateRow(row.id, { sort_order: Number(e.target.value) })} className="h-8 w-20" />
                      </TableCell>
                      <TableCell>
                        <Switch checked={cur.is_active} onCheckedChange={(v) => toggleActive(row, v)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {dirty && <Button size="sm" onClick={() => saveRow(row)}><Save className="h-3 w-3" /></Button>}
                          <Button size="sm" variant="ghost" onClick={() => del.mutate(row.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><Badge variant="outline">profile_field</Badge> can be any column on <code>profiles</code> plus derived: <code>email</code>, <code>primary_horseman</code>, <code>secondary_horseman</code>, <code>readiness_label</code>, <code>recommended_track</code>.</p>
            <p>Standard GHL keys: {STANDARD_KEYS.join(', ')}.</p>
          </div>
        </CardContent>
      </Card>

      {previewJson && (
        <Card>
          <CardHeader><CardTitle>Dry-run preview</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap">{previewJson}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
