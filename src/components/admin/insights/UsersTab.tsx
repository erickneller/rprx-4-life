import { useState, useMemo } from 'react';
import { useAdminUsersWithTier, type AdminUserRow } from '@/hooks/useAdminInsights';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { UserDetailDrawer } from './UserDetailDrawer';

const tierVariant = (t: string): 'default' | 'secondary' | 'outline' =>
  t === 'pro' ? 'default' : t === 'partner' ? 'secondary' : 'outline';

export function UsersTab() {
  const { data: users = [], isLoading } = useAdminUsersWithTier();
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const companies = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach(u => {
      if (u.company_id && u.company_name) map.set(u.company_id, u.company_name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter(u => {
      if (tierFilter !== 'all' && u.tier !== tierFilter) return false;
      if (companyFilter !== 'all' && u.company_id !== companyFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matches =
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.full_name && u.full_name.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [users, tierFilter, companyFilter, search]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1 min-w-0">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Search</label>
          <Input
            placeholder="Name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="md:w-44">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Tier</label>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tiers</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:w-56">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Company</label>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All companies</SelectItem>
              {companies.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Streak</TableHead>
                <TableHead className="text-right">XP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u: AdminUserRow) => (
                <TableRow
                  key={u.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedUserId(u.id)}
                >
                  <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                  <TableCell className="text-xs">{u.company_name || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={tierVariant(u.tier)} className="capitalize text-xs">
                      {u.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.last_active_date ? format(new Date(u.last_active_date), 'MMM d, yyyy') : '—'}
                  </TableCell>
                  <TableCell className="text-right">{u.current_streak}🔥</TableCell>
                  <TableCell className="text-right">{u.total_points_earned}⭐</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No users match the filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">{filtered.length} of {users.length} users</p>

      <UserDetailDrawer
        userId={selectedUserId}
        onOpenChange={(open) => !open && setSelectedUserId(null)}
      />
    </div>
  );
}
