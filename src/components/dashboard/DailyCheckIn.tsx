import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, X, Flame } from 'lucide-react';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function DailyCheckIn() {
  const { user } = useAuth();
  const { logActivity } = useGamification();
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check if user has an active strategy and hasn't checked in today
  const { data: activeStrategy } = useQuery({
    queryKey: ['active-strategy-for-checkin', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('user_active_strategies')
        .select('id, strategy_id, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: strategyDef } = useQuery({
    queryKey: ['strategy-def-checkin', activeStrategy?.strategy_id],
    queryFn: async () => {
      if (!activeStrategy?.strategy_id) return null;
      const { data } = await supabase
        .from('strategy_definitions')
        .select('name')
        .eq('id', activeStrategy.strategy_id)
        .maybeSingle();
      return data;
    },
    enabled: !!activeStrategy?.strategy_id,
  });

  // Check if already checked in today
  const { data: alreadyCheckedIn } = useQuery({
    queryKey: ['daily-checkin-today', user?.id],
    queryFn: async () => {
      if (!user?.id) return true;
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from('user_activity_log')
        .select('id')
        .eq('user_id', user.id)
        .eq('activity_type', 'daily_checkin')
        .gte('created_at', `${today}T00:00:00`)
        .limit(1);
      return (data?.length ?? 0) > 0;
    },
    enabled: !!user?.id,
  });

  if (!activeStrategy || alreadyCheckedIn || dismissed || submitted) return null;

  const handleYes = async () => {
    await logActivity('daily_checkin' as any, { strategy_id: activeStrategy.strategy_id, progress: true });
    setSubmitted(true);
    setShowSuccess(true);
    queryClient.invalidateQueries({ queryKey: ['daily-checkin-today', user?.id] });
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleNo = async () => {
    await logActivity('daily_checkin' as any, { strategy_id: activeStrategy.strategy_id, progress: false });
    setSubmitted(true);
    queryClient.invalidateQueries({ queryKey: ['daily-checkin-today', user?.id] });
  };

  if (showSuccess) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20">
        <CardContent className="py-4 flex items-center justify-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="font-semibold text-green-700 dark:text-green-400">Nice work! Keep it up!</span>
          <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Did you make progress on your strategy today?
            </p>
            {strategyDef?.name && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {strategyDef.name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" onClick={handleYes} className="bg-green-600 hover:bg-green-700 text-white">
              ✅ Yes
            </Button>
            <Button size="sm" variant="outline" onClick={handleNo}>
              Not today
            </Button>
            <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
