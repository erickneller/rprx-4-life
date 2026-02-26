import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MoreHorizontal, ShieldCheck, ShieldOff, KeyRound, Lock, Unlock, Trash2, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  raw_user_meta_data: Record<string, any> | null;
  full_name: string | null;
  phone: string | null;
  monthly_income: number | null;
  monthly_debt_payments: number | null;
  monthly_housing: number | null;
  monthly_insurance: number | null;
  monthly_living_expenses: number | null;
  emergency_fund_balance: number | null;
  filing_status: string | null;
  financial_goals: string[] | null;
  onboarding_completed: boolean | null;
  rprx_score_total: number | null;
  current_tier: string | null;
  total_points_earned: number | null;
  current_streak: number | null;
  health_insurance: boolean | null;
  life_insurance: boolean | null;
  disability_insurance: boolean | null;
  long_term_care_insurance: boolean | null;
  no_insurance: boolean | null;
  stress_money_worry: string | null;
  stress_emergency_confidence: string | null;
  stress_control_feeling: string | null;
  rprx_grade: string | null;
  // computed
  is_admin: boolean;
  tier: 'free' | 'paid';
}

function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: users, error: usersErr } = await supabase.rpc('admin_list_users');
      if (usersErr) throw usersErr;

      const [{ data: roles, error: rolesErr }, { data: subs, error: subsErr }] = await Promise.all([
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('user_subscriptions' as any).select('user_id, tier'),
      ]);
      if (rolesErr) throw rolesErr;
      if (subsErr) throw subsErr;

      const adminIds = new Set((roles || []).filter(r => r.role === 'admin').map(r => r.user_id));
      const tierMap = new Map((subs || []).map((s: any) => [s.user_id, s.tier]));

      return (users || []).map((u: any) => ({
        ...u,
        is_admin: adminIds.has(u.id),
        tier: (tierMap.get(u.id) || 'free') as 'free' | 'paid',
      })) as AdminUser[];
    },
  });
}

function useToggleTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, newTier }: { userId: string; newTier: 'free' | 'paid' }) => {
      const { error } = await supabase
        .from('user_subscriptions' as any)
        .upsert(
          { user_id: userId, tier: newTier, updated_by: (await supabase.auth.getUser()).data.user?.id } as any,
          { onConflict: 'user_id' }
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

function useToggleAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      if (makeAdmin) {
        const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

function useAdminAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ action, userId }: { action: string; userId: string }) => {
      const { data, error } = await supabase.functions.invoke('admin-user-actions', {
        body: { action, userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });
}

function getUserStatus(u: AdminUser): { label: string; variant: 'default' | 'secondary' | 'destructive' } {
  if (u.banned_until && new Date(u.banned_until) > new Date()) {
    return { label: 'Locked', variant: 'destructive' };
  }
  if (!u.email_confirmed_at) {
    return { label: 'Unconfirmed', variant: 'secondary' };
  }
  return { label: 'Active', variant: 'default' };
}

const fmt = (v: number | null | undefined) => v != null ? `$${v.toLocaleString()}` : '—';
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString() : '—';

export function UsersTab() {
  const { data: users = [], isLoading } = useAdminUsers();
  const toggleAdmin = useToggleAdmin();
  const toggleTier = useToggleTier();
  const adminAction = useAdminAction();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);

  const filtered = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase();
      if (q && !(u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q) || u.phone?.includes(q))) return false;
      if (statusFilter !== 'all') {
        const status = getUserStatus(u);
        if (statusFilter === 'active' && status.label !== 'Active') return false;
        if (statusFilter === 'locked' && status.label !== 'Locked') return false;
      }
      if (tierFilter !== 'all' && u.tier !== tierFilter) return false;
      return true;
    });
  }, [users, search, statusFilter, tierFilter]);

  const handleResetPassword = async (u: AdminUser) => {
    try {
      await adminAction.mutateAsync({ action: 'reset-password', userId: u.id });
      toast.success(`Password reset email sent to ${u.email}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    }
  };

  const handleToggleLock = async (u: AdminUser) => {
    try {
      const result = await adminAction.mutateAsync({ action: 'ban-user', userId: u.id });
      toast.success(result.message || 'User status updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    try {
      await adminAction.mutateAsync({ action: 'delete-user', userId: deleteUser.id });
      toast.success(`User ${deleteUser.email} deleted`);
      setDeleteUser(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    }
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
      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="locked">Locked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Sign In</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => {
              const status = getUserStatus(u);
              const isBanned = u.banned_until && new Date(u.banned_until) > new Date();
              return (
                <TableRow key={u.id} className="cursor-pointer" onClick={() => setDetailUser(u)}>
                  <TableCell className="font-medium">{u.full_name || u.raw_user_meta_data?.full_name || u.raw_user_meta_data?.name || '—'}</TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell className="text-sm">{u.phone || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(u.created_at)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(u.last_sign_in_at)}</TableCell>
                  <TableCell>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.is_admin ? (
                      <Badge className="bg-primary/10 text-primary border-primary/20">Admin</Badge>
                    ) : (
                      <Badge variant="secondary">User</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={u.tier === 'paid'}
                        onCheckedChange={(checked) => {
                          toggleTier.mutate(
                            { userId: u.id, newTier: checked ? 'paid' : 'free' },
                            {
                              onSuccess: () => toast.success(`User set to ${checked ? 'Paid' : 'Free'}`),
                              onError: (err) => toast.error((err as Error).message || 'Failed'),
                            }
                          );
                        }}
                        disabled={toggleTier.isPending}
                      />
                      <Badge variant={u.tier === 'paid' ? 'default' : 'secondary'} className={u.tier === 'paid' ? 'bg-green-600 text-white' : ''}>
                        {u.tier === 'paid' ? 'Paid' : 'Free'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetailUser(u)}>
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            toggleAdmin.mutate(
                              { userId: u.id, makeAdmin: !u.is_admin },
                              {
                                onSuccess: () => toast.success(u.is_admin ? 'Admin revoked' : 'Admin granted'),
                                onError: (err) => toast.error((err as Error).message),
                              }
                            );
                          }}
                          disabled={toggleAdmin.isPending}
                        >
                          {u.is_admin ? (
                            <><ShieldOff className="h-4 w-4 mr-2" /> Revoke Admin</>
                          ) : (
                            <><ShieldCheck className="h-4 w-4 mr-2" /> Make Admin</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleResetPassword(u)} disabled={adminAction.isPending}>
                          <KeyRound className="h-4 w-4 mr-2" /> Send Password Reset
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleLock(u)} disabled={adminAction.isPending}>
                          {isBanned ? (
                            <><Unlock className="h-4 w-4 mr-2" /> Unlock Account</>
                          ) : (
                            <><Lock className="h-4 w-4 mr-2" /> Lock Account</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteUser(u)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailUser} onOpenChange={(open) => !open && setDetailUser(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{detailUser?.full_name || detailUser?.email || 'User Details'}</DialogTitle>
            <DialogDescription>{detailUser?.email}</DialogDescription>
          </DialogHeader>
          {detailUser && (
            <ScrollArea className="flex-1 min-h-0 pr-4">
              <div className="space-y-6">
                {/* Account Info */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Account</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">ID:</span> <span className="font-mono text-xs">{detailUser.id}</span></div>
                    <div><span className="text-muted-foreground">Phone:</span> {detailUser.phone || '—'}</div>
                    <div><span className="text-muted-foreground">Joined:</span> {fmtDate(detailUser.created_at)}</div>
                    <div><span className="text-muted-foreground">Last Sign In:</span> {fmtDate(detailUser.last_sign_in_at)}</div>
                    <div><span className="text-muted-foreground">Email Confirmed:</span> {fmtDate(detailUser.email_confirmed_at)}</div>
                    <div><span className="text-muted-foreground">Status:</span> <Badge variant={getUserStatus(detailUser).variant}>{getUserStatus(detailUser).label}</Badge></div>
                    <div><span className="text-muted-foreground">RPRx Grade:</span> {detailUser.rprx_grade || '—'}</div>
                    <div><span className="text-muted-foreground">RPRx Score:</span> {detailUser.rprx_score_total ?? '—'}</div>
                    <div><span className="text-muted-foreground">Onboarding:</span> {detailUser.onboarding_completed ? 'Complete' : 'Incomplete'}</div>
                    <div><span className="text-muted-foreground">Tier:</span> {detailUser.current_tier || detailUser.tier}</div>
                  </div>
                </section>

                {/* Financial Info */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Financial Profile</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Monthly Income:</span> {fmt(detailUser.monthly_income)}</div>
                    <div><span className="text-muted-foreground">Debt Payments:</span> {fmt(detailUser.monthly_debt_payments)}</div>
                    <div><span className="text-muted-foreground">Housing:</span> {fmt(detailUser.monthly_housing)}</div>
                    <div><span className="text-muted-foreground">Insurance:</span> {fmt(detailUser.monthly_insurance)}</div>
                    <div><span className="text-muted-foreground">Living Expenses:</span> {fmt(detailUser.monthly_living_expenses)}</div>
                    <div><span className="text-muted-foreground">Emergency Fund:</span> {fmt(detailUser.emergency_fund_balance)}</div>
                    <div><span className="text-muted-foreground">Filing Status:</span> {detailUser.filing_status || '—'}</div>
                  </div>
                </section>

                {/* Insurance Coverage */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Insurance Coverage</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailUser.health_insurance && <Badge variant="secondary">Health</Badge>}
                    {detailUser.life_insurance && <Badge variant="secondary">Life</Badge>}
                    {detailUser.disability_insurance && <Badge variant="secondary">Disability</Badge>}
                    {detailUser.long_term_care_insurance && <Badge variant="secondary">Long-Term Care</Badge>}
                    {detailUser.no_insurance && <Badge variant="destructive">None</Badge>}
                    {!detailUser.health_insurance && !detailUser.life_insurance && !detailUser.disability_insurance && !detailUser.long_term_care_insurance && !detailUser.no_insurance && <span className="text-sm text-muted-foreground">Not specified</span>}
                  </div>
                </section>

                {/* Stress Indicators */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Stress Indicators</h3>
                  <div className="grid grid-cols-1 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Money Worry:</span> {detailUser.stress_money_worry || '—'}</div>
                    <div><span className="text-muted-foreground">Emergency Confidence:</span> {detailUser.stress_emergency_confidence || '—'}</div>
                    <div><span className="text-muted-foreground">Control Feeling:</span> {detailUser.stress_control_feeling || '—'}</div>
                  </div>
                </section>

                {/* Financial Goals */}
                {detailUser.financial_goals && detailUser.financial_goals.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Financial Goals</h3>
                    <div className="flex flex-wrap gap-2">
                      {detailUser.financial_goals.map((g, i) => (
                        <Badge key={i} variant="outline">{g}</Badge>
                      ))}
                    </div>
                  </section>
                )}

                {/* Gamification */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Gamification</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Total XP:</span> {detailUser.total_points_earned ?? 0}</div>
                    <div><span className="text-muted-foreground">Current Streak:</span> {detailUser.current_streak ?? 0} days</div>
                  </div>
                </section>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteUser?.email}</strong> and all their data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={adminAction.isPending}
            >
              {adminAction.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
