import { useAdminAnalytics } from '@/hooks/useAdminAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, ClipboardCheck, Target, Award } from 'lucide-react';

const horsemanLabels: Record<string, string> = {
  interest: '💰 Interest', taxes: '📋 Taxes', insurance: '🛡️ Insurance', education: '🎓 Education',
};

export function AnalyticsTab() {
  const { data, isLoading } = useAdminAnalytics();

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" /> Total Users</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{data.totalUsers}</p><p className="text-xs text-muted-foreground">{data.recentSignups} in last 7 days</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><ClipboardCheck className="h-4 w-4" /> Assessments</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{data.completedAssessments}</p><p className="text-xs text-muted-foreground">completed</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Target className="h-4 w-4" /> Active Strategies</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{data.totalStrategies}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Award className="h-4 w-4" /> Badges Earned</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{data.totalBadgesEarned}</p></CardContent>
        </Card>
      </div>

      {/* Horseman breakdown */}
      <Card>
        <CardHeader><CardTitle className="text-base">Assessments by Primary Horseman</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(data.horsemanCounts).map(([key, count]) => {
              const max = Math.max(...Object.values(data.horsemanCounts), 1);
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm"><span>{horsemanLabels[key] || key}</span><span className="font-medium">{count}</span></div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(count / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Badge stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Most Earned Badges</CardTitle></CardHeader>
          <CardContent>
            {data.topBadges.length === 0 ? <p className="text-muted-foreground text-sm">No badges earned yet.</p> : (
              <div className="space-y-2">
                {data.topBadges.map(([id, count]) => (
                  <div key={id} className="flex justify-between text-sm"><span className="font-mono">{id}</span><span className="font-medium">{count}</span></div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Least Earned Badges</CardTitle></CardHeader>
          <CardContent>
            {data.leastBadges.length === 0 ? <p className="text-muted-foreground text-sm">No badges earned yet.</p> : (
              <div className="space-y-2">
                {data.leastBadges.map(([id, count]) => (
                  <div key={id} className="flex justify-between text-sm"><span className="font-mono">{id}</span><span className="font-medium">{count}</span></div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
