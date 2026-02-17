import { useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { useAdminStrategies, useCreateStrategy, useUpdateStrategy, useDeleteStrategy, type StrategyRow, type StrategyInput } from '@/hooks/useAdminStrategies';
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
import { Plus, Pencil, Trash2, Loader2, Shield, Users, ShieldCheck, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
  strategy_summary: '',
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

  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const toggleAdmin = useToggleAdmin();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StrategyInput>(emptyForm);
  const [goalsInput, setGoalsInput] = useState('');

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
      strategy_summary: row.strategy_summary || '',
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
              <Users className="h-4 w-4" /> User Management
            </TabsTrigger>
          </TabsList>

          {/* ===== STRATEGIES TAB ===== */}
          <TabsContent value="strategies" className="space-y-4">
            <div className="flex justify-end">
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
                      <TableHead className="w-24">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Horseman</TableHead>
                      <TableHead>Tax Line / Area</TableHead>
                      <TableHead>Financial Goals</TableHead>
                      <TableHead>Strategy Summary</TableHead>
                      <TableHead className="w-20">Active</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {strategies.map((s) => (
                      <TableRow key={s.id}>
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
                        <TableCell className="text-sm max-w-[250px] truncate">
                          {s.strategy_summary || '—'}
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

          {/* ===== USER MANAGEMENT TAB ===== */}
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
              <Label>Strategy Summary</Label>
              <Textarea
                rows={3}
                placeholder="Brief summary of this strategy..."
                value={form.strategy_summary || ''}
                onChange={(e) => setForm(f => ({ ...f, strategy_summary: e.target.value }))}
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
    </AuthenticatedLayout>
  );
}
