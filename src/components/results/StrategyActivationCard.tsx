import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, Zap, Target, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { showAchievementToast, showPointsEarnedToast } from '@/components/gamification/AchievementToast';
import type { HorsemanType } from '@/lib/scoringEngine';

interface StrategyActivationCardProps {
  primaryHorseman: HorsemanType;
}

interface StrategyDef {
  id: string;
  name: string;
  description: string;
  horseman_type: string;
  difficulty: string;
  estimated_impact: string | null;
  steps: string[];
}

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; icon: typeof Zap }> = {
  quick_win: { label: 'Quick Win', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', icon: Zap },
  moderate: { label: 'Moderate', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: Target },
  advanced: { label: 'Advanced', color: 'bg-rose-500/10 text-rose-600 border-rose-500/30', icon: TrendingUp },
};

export function StrategyActivationCard({ primaryHorseman }: StrategyActivationCardProps) {
  const { user } = useAuth();
  const { logActivity } = useGamification();
  const queryClient = useQueryClient();
  const [activatingId, setActivatingId] = useState<string | null>(null);

  // Fetch strategies for primary horseman
  const { data: strategies = [], isLoading } = useQuery({
    queryKey: ['strategy-definitions', primaryHorseman],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategy_definitions')
        .select('*')
        .eq('horseman_type', primaryHorseman)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return (data ?? []).map((s) => ({
        ...s,
        steps: Array.isArray(s.steps) ? s.steps as string[] : [],
      })) as StrategyDef[];
    },
    enabled: !!primaryHorseman,
  });

  // Fetch user's already-activated strategies
  const { data: activeStrategies = [] } = useQuery({
    queryKey: ['user-active-strategies', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_active_strategies')
        .select('strategy_id, status')
        .eq('user_id', user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const activatedIds = new Set(activeStrategies.map((s) => s.strategy_id));

  const activateStrategy = useMutation({
    mutationFn: async (strategy: StrategyDef) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('user_active_strategies').insert({
        user_id: user.id,
        strategy_id: strategy.id,
        status: 'active',
      });
      if (error) throw error;
      return strategy;
    },
    onSuccess: async (strategy) => {
      queryClient.invalidateQueries({ queryKey: ['user-active-strategies', user?.id] });

      // Log gamification activity
      const awarded = await logActivity('strategy_activated', {
        strategy_id: strategy.id,
        horseman_type: strategy.horseman_type,
        difficulty: strategy.difficulty,
      });

      showPointsEarnedToast(50, `Strategy activated: ${strategy.name}`);
      awarded.forEach((badge) => showAchievementToast(badge));
      setActivatingId(null);
    },
    onError: () => {
      setActivatingId(null);
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (strategies.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          Recommended Strategies
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Activate strategies to start earning RPRx points and track your progress
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {strategies.map((strategy) => {
          const isActivated = activatedIds.has(strategy.id);
          const isActivating = activatingId === strategy.id;
          const diffConfig = DIFFICULTY_CONFIG[strategy.difficulty] ?? DIFFICULTY_CONFIG.moderate;
          const DiffIcon = diffConfig.icon;

          return (
            <div
              key={strategy.id}
              className={`rounded-lg border p-4 transition-colors ${
                isActivated
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border hover:border-primary/20 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-foreground text-sm">{strategy.name}</h4>
                    <Badge variant="outline" className={`text-xs ${diffConfig.color}`}>
                      <DiffIcon className="h-3 w-3 mr-1" />
                      {diffConfig.label}
                    </Badge>
                    {strategy.estimated_impact && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-xs bg-accent/10 text-accent-foreground border-accent/30">
                              {strategy.estimated_impact}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Estimated annual savings</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {strategy.description}
                  </p>
                </div>

                <div className="shrink-0">
                  {isActivated ? (
                    <Badge className="bg-primary/10 text-primary border-primary/30">
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      disabled={isActivating}
                      onClick={() => {
                        setActivatingId(strategy.id);
                        activateStrategy.mutate(strategy);
                      }}
                    >
                      {isActivating ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Zap className="h-3 w-3 mr-1" />
                      )}
                      Activate
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <p className="text-xs text-muted-foreground text-center pt-2">
          +50 RPRx points per strategy activated • Activate all 4 horsemen for a bonus badge
        </p>
      </CardContent>
    </Card>
  );
}
