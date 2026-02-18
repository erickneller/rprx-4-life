import { useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { useAdminStrategies, useCreateStrategy, useUpdateStrategy, useDeleteStrategy, useDeleteStrategies, useImportStrategies, useBulkToggleActive, type StrategyRow, type StrategyInput } from '@/hooks/useAdminStrategies';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Loader2, Shield, Users, ShieldCheck, ShieldOff, Award, HelpCircle, Layers, BarChart3, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BadgesTab } from '@/components/admin/BadgesTab';
import { AssessmentQuestionsTab } from '@/components/admin/AssessmentQuestionsTab';
import { DeepDiveQuestionsTab } from '@/components/admin/DeepDiveQuestionsTab';
import { AnalyticsTab } from '@/components/admin/AnalyticsTab';

const HORSEMAN_TYPES = ['interest', 'taxes', 'insurance', 'education'];
const DIFFICULTIES = ['easy', 'moderate', 'advanced'];

const emptyForm: StrategyInput = {
  id: '',
  name: '',
  description: '',
  horseman_type: 'taxes',
  difficulty: 'moderate',
  estimated_impact: '',
  tax_return_line_or_area: '',
  financial_goals: [],
};

// --- User management hooks ---

interface AppUser {
  id: string;
  email: string;
  created_at: string;
  is_admin: boolean;
}

function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Get users via secure function
      const { data: users, error: usersErr } = await supabase.rpc('admin_list_users');
      if (usersErr) throw usersErr;

      // Get all admin roles
      const { data: roles, error: rolesErr } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (rolesErr) throw rolesErr;

      const adminIds = new Set((roles || []).filter(r => r.role === 'admin').map(r => r.user_id));

      return (users || []).map((u: { id: string; email: string; created_at: string }) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        is_admin: adminIds.has(u.id),
      })) as AppUser[];
    },
  });
}

function useToggleAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      if (makeAdmin) {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}

export default function AdminPanel() {
  const { data: strategies = [], isLoading } = useAdminStrategies();
  const createStrategy = useCreateStrategy();
  const updateStrategy = useUpdateStrategy();
  const deleteStrategy = useDeleteStrategy();
  const deleteStrategies = useDeleteStrategies();
  const importStrategies = useImportStrategies();
  const bulkToggleActive = useBulkToggleActive();

  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const toggleAdmin = useToggleAdmin();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StrategyInput>(emptyForm);
  const [goalsInput, setGoalsInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setGoalsInput('');
    setDialogOpen(true);
  };

  const openEdit = (row: StrategyRow) => {
    setEditingId(row.id);
    setForm({
      id: row.id,
      name: row.name,
      description: row.description,
      horseman_type: row.horseman_type,
      difficulty: row.difficulty,
      estimated_impact: row.estimated_impact || '',
      tax_return_line_or_area: row.tax_return_line_or_area || '',
      financial_goals: row.financial_goals || [],
    });
    setGoalsInput((row.financial_goals || []).join(', '));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.id || !form.name) {
      toast.error('ID and Name are required');
      return;
    }
    const goals = goalsInput.split(',').map(g => g.trim()).filter(Boolean);
    const payload = { ...form, financial_goals: goals };

    try {
      if (editingId) {
        await updateStrategy.mutateAsync(payload);
        toast.success('Strategy updated');
      } else {
        await createStrategy.mutateAsync(payload);
        toast.success('Strategy created');
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to save');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteStrategy.mutateAsync(deleteId);
      toast.success('Strategy deleted');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to delete');
    }
    setDeleteId(null);
  };

  const handleBulkDelete = async () => {
    try {
      await deleteStrategies.mutateAsync(Array.from(selectedIds));
      toast.success(`${selectedIds.size} strategies deleted`);
      setSelectedIds(new Set());
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to delete');
    }
    setBulkDeleteOpen(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === strategies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(strategies.map(s => s.id)));
    }
  };

  // CSV helpers
  const escapeCSV = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const handleExportCSV = () => {
    const rows = selectedIds.size > 0 ? strategies.filter(s => selectedIds.has(s.id)) : strategies;
    const headers = ['id','name','description','horseman_type','difficulty','estimated_impact','tax_return_line_or_area','financial_goals','sort_order','is_active'];
    const csvLines = [headers.join(',')];
    for (const s of rows) {
      csvLines.push([
        escapeCSV(s.id),
        escapeCSV(s.name),
        escapeCSV(s.description),
        escapeCSV(s.horseman_type),
        escapeCSV(s.difficulty),
        escapeCSV(s.estimated_impact || ''),
        escapeCSV(s.tax_return_line_or_area || ''),
        escapeCSV((s.financial_goals || []).join(';')),
        String(s.sort_order),
        String(s.is_active),
      ].join(','));
    }
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'strategies.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} strategies`);
  };

  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let current = '';
    let inQuotes = false;
    let row: string[] = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"' && text[i + 1] === '"') { current += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { current += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { row.push(current); current = ''; }
        else if (ch === '\n' || ch === '\r') {
          if (ch === '\r' && text[i + 1] === '\n') i++;
          row.push(current); current = '';
          if (row.some(c => c.trim())) rows.push(row);
          row = [];
        } else { current += ch; }
      }
    }
    row.push(current);
    if (row.some(c => c.trim())) rows.push(row);
    return rows;
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length < 2) { toast.error('CSV has no data rows'); return; }
        const headers = parsed[0].map(h => h.trim().toLowerCase());
        const idIdx = headers.indexOf('id');
        const nameIdx = headers.indexOf('name');
        const descIdx = headers.indexOf('description');
        const horseIdx = headers.indexOf('horseman_type');
        const diffIdx = headers.indexOf('difficulty');
        if (idIdx < 0 || nameIdx < 0 || descIdx < 0 || horseIdx < 0 || diffIdx < 0) {
          toast.error('CSV missing required columns: id, name, description, horseman_type, difficulty');
          return;
        }
        const impactIdx = headers.indexOf('estimated_impact');
        const taxIdx = headers.indexOf('tax_return_line_or_area');
        const goalsIdx = headers.indexOf('financial_goals');
        const orderIdx = headers.indexOf('sort_order');
        const activeIdx = headers.indexOf('is_active');

        const items: StrategyInput[] = parsed.slice(1).map(row => ({
          id: row[idIdx]?.trim() || '',
          name: row[nameIdx]?.trim() || '',
          description: row[descIdx]?.trim() || '',
          horseman_type: row[horseIdx]?.trim() || 'taxes',
          difficulty: row[diffIdx]?.trim() || 'moderate',
          estimated_impact: impactIdx >= 0 ? row[impactIdx]?.trim() : undefined,
          tax_return_line_or_area: taxIdx >= 0 ? row[taxIdx]?.trim() : undefined,
          financial_goals: goalsIdx >= 0 ? (row[goalsIdx]?.trim() || '').split(';').filter(Boolean) : [],
          sort_order: orderIdx >= 0 ? parseInt(row[orderIdx]?.trim() || '0', 10) || 0 : 0,
          is_active: activeIdx >= 0 ? row[activeIdx]?.trim().toLowerCase() !== 'false' : true,
        })).filter(r => r.id && r.name);

        await importStrategies.mutateAsync(items);
        toast.success(`Imported ${items.length} strategies`);
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Import failed');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const allActive = strategies.length > 0 && strategies.every(s => s.is_active);
  const noneActive = strategies.length > 0 && strategies.every(s => !s.is_active);
  const handleMasterToggle = async (checked: boolean) => {
    try {
      await bulkToggleActive.mutateAsync(checked);
      toast.success(checked ? 'All strategies activated' : 'All strategies deactivated');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to toggle');
    }
  };

  const handleToggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    try {
      await toggleAdmin.mutateAsync({ userId, makeAdmin: !currentlyAdmin });
      toast.success(currentlyAdmin ? 'Admin access removed' : 'Admin access granted');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Failed to update role');
    }
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

  return (
    <AuthenticatedLayout title="Admin Panel">
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>

        <Tabs defaultValue="strategies">
          <TabsList>
            <TabsTrigger value="strategies" className="gap-1">
              <Shield className="h-4 w-4" /> Strategies
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1">
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-1">
              <Award className="h-4 w-4" /> Badges
            </TabsTrigger>
            <TabsTrigger value="assessment-questions" className="gap-1">
              <HelpCircle className="h-4 w-4" /> Assessment Q's
            </TabsTrigger>
            <TabsTrigger value="deepdive-questions" className="gap-1">
              <Layers className="h-4 w-4" /> Deep Dive Q's
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1">
              <BarChart3 className="h-4 w-4" /> Analytics
            </TabsTrigger>
          </TabsList>

          {/* ===== STRATEGIES TAB ===== */}
          <TabsContent value="strategies" className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="master-active" className="text-sm">All Active</Label>
                <Switch
                  id="master-active"
                  checked={allActive}
                  onCheckedChange={handleMasterToggle}
                  disabled={bulkToggleActive.isPending || strategies.length === 0}
                  className={!allActive && !noneActive ? 'opacity-60' : ''}
                />
              </div>
              <div className="flex-1" />
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
                  <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete Selected
                  </Button>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
              <label>
                <Button variant="outline" size="sm" className="gap-1" asChild>
                  <span><Upload className="h-4 w-4" /> Import CSV</span>
                </Button>
                <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
              </label>
              <Button onClick={openCreate} className="gap-1">
                <Plus className="h-4 w-4" /> Add Strategy
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="border rounded-lg overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={strategies.length > 0 && selectedIds.size === strategies.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-24">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Horseman</TableHead>
                      <TableHead>Tax Line / Area</TableHead>
                      <TableHead>Financial Goals</TableHead>
                      <TableHead className="w-20">Active</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strategies.map((s) => (
                      <TableRow key={s.id} data-state={selectedIds.has(s.id) ? 'selected' : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(s.id)}
                            onCheckedChange={() => toggleSelect(s.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{s.id}</TableCell>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={horsemanColor(s.horseman_type)}>
                            {s.horseman_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{s.tax_return_line_or_area || '—'}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {(s.financial_goals || []).join(', ') || '—'}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={s.is_active}
                            onCheckedChange={(checked) =>
                              updateStrategy.mutate({ id: s.id, is_active: checked })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {strategies.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No strategies found. Add your first one!
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          <TabsContent value="users" className="space-y-4">
            {usersLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="border rounded-lg overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="w-28">Role</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {u.is_admin ? (
                            <Badge className="bg-primary/10 text-primary border-primary/20">Admin</Badge>
                          ) : (
                            <Badge variant="secondary">User</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant={u.is_admin ? 'outline' : 'default'}
                            size="sm"
                            className="gap-1"
                            disabled={toggleAdmin.isPending}
                            onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                          >
                            {u.is_admin ? (
                              <>
                                <ShieldOff className="h-3 w-3" /> Revoke
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-3 w-3" /> Make Admin
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          {/* ===== BADGES TAB ===== */}
          <TabsContent value="badges" className="space-y-4">
            <BadgesTab />
          </TabsContent>

          {/* ===== ASSESSMENT QUESTIONS TAB ===== */}
          <TabsContent value="assessment-questions" className="space-y-4">
            <AssessmentQuestionsTab />
          </TabsContent>

          {/* ===== DEEP DIVE QUESTIONS TAB ===== */}
          <TabsContent value="deepdive-questions" className="space-y-4">
            <DeepDiveQuestionsTab />
          </TabsContent>

          {/* ===== ANALYTICS TAB ===== */}
          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create / Edit Strategy Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Strategy' : 'Add Strategy'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Strategy ID</Label>
                <Input
                  placeholder="e.g. T-1"
                  value={form.id}
                  disabled={!!editingId}
                  onChange={(e) => setForm(f => ({ ...f, id: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Horseman Type</Label>
                <Select value={form.horseman_type} onValueChange={(v) => setForm(f => ({ ...f, horseman_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HORSEMAN_TYPES.map(h => (
                      <SelectItem key={h} value={h}>{h.charAt(0).toUpperCase() + h.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Strategy Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Tax Return Line or Area</Label>
              <Input
                placeholder="e.g. Schedule A, Line 5"
                value={form.tax_return_line_or_area || ''}
                onChange={(e) => setForm(f => ({ ...f, tax_return_line_or_area: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Financial Goals (comma-separated)</Label>
              <Input
                placeholder="e.g. Reduce taxes, Maximize deductions"
                value={goalsInput}
                onChange={(e) => setGoalsInput(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm(f => ({ ...f, difficulty: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map(d => (
                      <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Estimated Impact</Label>
                <Input
                  placeholder="e.g. $500-$2000/yr"
                  value={form.estimated_impact || ''}
                  onChange={(e) => setForm(f => ({ ...f, estimated_impact: e.target.value }))}
                />
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={createStrategy.isPending || updateStrategy.isPending}
            >
              {(createStrategy.isPending || updateStrategy.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {editingId ? 'Update Strategy' : 'Create Strategy'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Strategy?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove strategy "{deleteId}" and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Strategies?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {selectedIds.size} selected strategies. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthenticatedLayout>
  );
}
