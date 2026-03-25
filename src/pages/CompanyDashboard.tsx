import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { useCompanyDashboard } from '@/hooks/useCompanyDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Activity, ClipboardCheck, Flame } from 'lucide-react';
import { format } from 'date-fns';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';

export default function CompanyDashboard() {
  const { company, isCompanyAdmin, members, stats, isLoading } = useCompanyDashboard();

  // Build signup-over-time chart data (by month) — must be before any early returns
  const signupData = useMemo(() => {
    const counts: Record<string, number> = {};
    members.forEach(m => {
      const month = format(new Date(m.joined_at), 'MMM yyyy');
      counts[month] = (counts[month] || 0) + 1;
    });
    return Object.entries(counts).map(([month, count]) => ({ month, count }));
  }, [members]);

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!isCompanyAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const statCards = [
    { label: 'Total Members', value: stats.totalMembers, icon: Users },
    { label: 'Active This Week', value: stats.activeThisWeek, icon: Activity },
    { label: 'Assessments Done', value: stats.assessmentsCompleted, icon: ClipboardCheck },
    { label: 'Onboarding Done', value: stats.onboardingCompleted, icon: Flame },
  ];

  return (
    <AuthenticatedLayout>
      <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{company?.name}</h1>
          <p className="text-muted-foreground text-sm">Company engagement overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(s => (
            <Card key={s.label}>
              <CardContent className="pt-6 flex flex-col items-center text-center gap-2">
                <s.icon className="h-6 w-6 text-primary" />
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Signups Chart */}
        {signupData.length > 1 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Member Signups Over Time</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={signupData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Member Table */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Member Activity</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Streak</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Assessment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(m => (
                  <TableRow key={m.user_id}>
                    <TableCell className="font-medium">{m.full_name || 'Unnamed'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{format(new Date(m.joined_at), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {m.last_active_date ? format(new Date(m.last_active_date), 'MMM d') : '—'}
                    </TableCell>
                    <TableCell>{m.current_streak}🔥</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs capitalize">{m.current_tier}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={m.has_assessment ? 'default' : 'outline'} className="text-xs">
                        {m.has_assessment ? 'Done' : 'Not yet'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {members.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No members yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
