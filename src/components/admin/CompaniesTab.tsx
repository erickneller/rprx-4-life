import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Copy, Check, Building2, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { buildInviteUrl } from '@/hooks/useCompany';

interface CompanyRow {
  id: string;
  name: string;
  slug: string;
  plan: string;
  owner_id: string | null;
  invite_token: string;
  created_at: string;
  member_count?: number;
  owner_email?: string;
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function CompaniesTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPlan, setNewPlan] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingCompany, setEditingCompany] = useState<CompanyRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editPlan, setEditPlan] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [deleteTarget, setDeleteTarget] = useState<CompanyRow | null>(null);

  // ─── Fetch all companies with member counts ─────────────────────────────
  const { data: companies = [], isLoading } = useQuery<CompanyRow[]>({
    queryKey: ['admin-companies'],
    queryFn: async () => {
      // Fetch companies
      const { data: rows, error } = await (supabase
        .from('companies') as any)
        .select('id, name, slug, plan, owner_id, invite_token, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch member counts per company
      const { data: memberCounts } = await (supabase
        .from('company_members') as any)
        .select('company_id');

      const countMap: Record<string, number> = {};
      (memberCounts ?? []).forEach((m: { company_id: string }) => {
        countMap[m.company_id] = (countMap[m.company_id] ?? 0) + 1;
      });

      return (rows ?? []).map((r: any) => ({
        ...r,
        member_count: countMap[r.id] ?? 0,
      }));
    },
  });

  // ─── Create company ──────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async () => {
      const name = newName.trim();
      if (!name) throw new Error('Company name is required.');

      const slug = `${toSlug(name)}-${Math.random().toString(36).slice(2, 7)}`;

      const { error } = await (supabase
        .from('companies') as any)
        .insert({ name, slug, plan: newPlan });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Company created.');
      setNewName('');
      setNewPlan('free');
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
    },
    onError: (err: any) => toast.error(err.message ?? 'Failed to create company.'),
  });

  // ─── Copy invite link ────────────────────────────────────────────────────
  const handleCopy = async (company: CompanyRow) => {
    const url = buildInviteUrl(company.invite_token);
    await navigator.clipboard.writeText(url);
    setCopiedId(company.id);
    toast.success('Invite link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ─── Refresh token ───────────────────────────────────────────────────────
  const refreshTokenMutation = useMutation({
    mutationFn: async (companyId: string) => {
      // Generate a new UUID client-side (crypto.randomUUID is available in all modern browsers)
      const newToken = crypto.randomUUID();
      const { error } = await (supabase
        .from('companies') as any)
        .update({ invite_token: newToken })
        .eq('id', companyId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Invite token refreshed.');
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
    },
    onError: (err: any) => toast.error(err.message ?? 'Failed to refresh token.'),
  });

  // ─── Update company ─────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingCompany) return;
      const { error } = await (supabase.from('companies') as any)
        .update({ name: editName.trim(), plan: editPlan })
        .eq('id', editingCompany.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Company updated.');
      setEditingCompany(null);
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
    },
    onError: (err: any) => toast.error(err.message ?? 'Failed to update company.'),
  });

  // ─── Delete company ─────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (company: CompanyRow) => {
      // Delete members first (no FK cascade)
      await (supabase.from('company_members') as any)
        .delete()
        .eq('company_id', company.id);
      const { error } = await (supabase.from('companies') as any)
        .delete()
        .eq('id', company.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Company deleted.');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
    },
    onError: (err: any) => toast.error(err.message ?? 'Failed to delete company.'),
  });

  const openEdit = (company: CompanyRow) => {
    setEditName(company.name);
    setEditPlan(company.plan as any);
    setEditingCompany(company);
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Companies
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage corporate accounts and their invite links.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" /> Add Company
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No companies yet. Create one to get started.
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Invite Link</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map(company => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{company.slug}</TableCell>
                  <TableCell>
                    <Badge variant={company.plan === 'enterprise' ? 'default' : company.plan === 'pro' ? 'secondary' : 'outline'}>
                      {company.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{company.member_count ?? 0}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(company.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs h-7 px-2"
                        onClick={() => handleCopy(company)}
                      >
                        {copiedId === company.id
                          ? <><Check className="h-3 w-3" /> Copied</>
                          : <><Copy className="h-3 w-3" /> Copy Link</>
                        }
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        title="Refresh invite token"
                        onClick={() => {
                          if (confirm('This will invalidate the current invite link. Continue?')) {
                            refreshTokenMutation.mutate(company.id);
                          }
                        }}
                        disabled={refreshTokenMutation.isPending}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Company Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Acme Corp"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createMutation.mutate(); }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="companyPlan">Plan</Label>
              <select
                id="companyPlan"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={newPlan}
                onChange={e => setNewPlan(e.target.value as any)}
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !newName.trim()}
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
