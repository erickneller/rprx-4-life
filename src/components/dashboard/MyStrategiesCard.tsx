import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle2, Loader2, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { showAchievementToast, showPointsEarnedToast } from '@/components/gamification/AchievementToast';

interface ActiveStrategy {
  id: string;
  strategy_id: string;
  status: string;
  activated_at: string;
  completed_at: string | null;
  strategy: {
    name: string;
    description: string;
    horseman_type: string;
    difficulty: string;
    estimated_impact: string | null;
  } | null;
}

const HORSEMAN_LABELS: Record<string, string> = {
  interest: 'Interest',
  taxes: 'Taxes',
  insurance: 'Insurance',
  education: 'Education',
};

export function MyStrategiesCard() {
  const { user } = useAuth();
  const { logActivity } = useGamification();
  const queryClient = useQueryClient();
  const [completingId, setCompletingId] = useState<string | null>(null);

  const { data: strategies = [], isLoading } = useQuery({
    queryKey: ['my-active-strategies', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Fetch active strategies
      const { data: active, error } = await supabase
        .from('user_active_strategies')
        .select('*')
        .eq('user_id', user.id)
        .order('activated_at', { ascending: false });
      if (error) throw error;
      if (!active || active.length === 0) return [];

      // Fetch strategy definitions for these
      const strategyIds = active.map((s) => s.strategy_id);
      const { data: defs } = await supabase
        .from('strategy_definitions')
        .select('id, name, description, horseman_type, difficulty, estimated_impact')
        .in('id', strategyIds);

      const defMap = new Map((defs ?? []).map((d) => [d.id, d]));

      return active.map((s) => ({
        ...s,
        strategy: defMap.get(s.strategy_id) ?? null,
      })) as ActiveStrategy[];
    },
    enabled: !!user?.id,
  });

  const completeStrategy = useMutation({
    mutationFn: async (strategyRow: ActiveStrategy) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_active_strategies')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', strategyRow.id);
      if (error) throw error;
      return strategyRow;
    },
    onSuccess: async (strategyRow) => {
      queryClient.invalidateQueries({ queryKey: ['my-active-strategies', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-active-strategies', user?.id] });

      const { awarded, xpEarned } = await logActivity('strategy_completed', {
        strategy_id: strategyRow.strategy_id,
        horseman_type: strategyRow.strategy?.horseman_type,
      });

      if (xpEarned > 0) showPointsEarnedToast(xpEarned, `Strategy completed: ${strategyRow.strategy?.name}`);
      awarded.forEach((badge) => showAchievementToast(badge));
      setCompletingId(null);
    },
    onError: () => setCompletingId(null),
  });

  const activeStrategies = strategies.filter((s) => s.status === 'active');
  const completedStrategies = strategies.filter((s) => s.status === 'completed');

  if (isLoading) return null;
  if (strategies.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          My Strategies
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {activeStrategies.length} active · {completedStrategies.length} completed
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeStrategies.map((s) => {
          const isCompleting = completingId === s.id;
          return (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-foreground truncate">
                    {s.strategy?.name ?? s.strategy_id}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {HORSEMAN_LABELS[s.strategy?.horseman_type ?? ''] ?? s.strategy?.horseman_type}
                  </Badge>
                </div>
                {s.strategy?.estimated_impact && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Impact: {s.strategy.estimated_impact}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 text-xs gap-1"
                disabled={isCompleting}
                onClick={() => {
                  setCompletingId(s.id);
                  completeStrategy.mutate(s);
                }}
              >
                {isCompleting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                Mark Complete
              </Button>
            </div>
          );
        })}

        {completedStrategies.length > 0 && (
          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              Completed
            </p>
            {completedStrategies.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3"
              >
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-foreground truncate">
                  {s.strategy?.name ?? s.strategy_id}
                </span>
                <Badge variant="outline" className="text-xs ml-auto shrink-0">
                  +30 XP
                </Badge>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-1">
          +30 XP per strategy completed
        </p>
      </CardContent>
    </Card>
  );
}
