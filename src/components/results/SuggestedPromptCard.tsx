import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { type AssessmentResponseDetail } from '@/lib/promptGenerator';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useCreatePlan, usePlans } from '@/hooks/usePlans';
import { useSubscription } from '@/hooks/useSubscription';
import { autoGenerateStrategy } from '@/lib/autoStrategyGenerator';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { UserAssessment } from '@/lib/assessmentTypes';

interface SuggestedPromptCardProps {
  assessment: UserAssessment;
}

function useAssessmentResponses(assessmentId: string | undefined) {
  return useQuery({
    queryKey: ['assessmentResponses', assessmentId],
    enabled: !!assessmentId,
    queryFn: async (): Promise<AssessmentResponseDetail[]> => {
      const { data, error } = await supabase
        .from('assessment_responses')
        .select('response_value, question_id')
        .eq('assessment_id', assessmentId!);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      const questionIds = data.map((r) => r.question_id);
      const { data: questions, error: qErr } = await supabase
        .from('assessment_questions')
        .select('id, question_text, category')
        .in('id', questionIds);

      if (qErr) throw qErr;

      const qMap = new Map(questions?.map((q) => [q.id, q]) || []);

      return data.map((r) => {
        const q = qMap.get(r.question_id);
        const val = (r.response_value as { value?: string })?.value ?? JSON.stringify(r.response_value);
        return {
          question_text: q?.question_text ?? 'Unknown question',
          category: q?.category ?? 'General',
          value: val,
        };
      });
    },
  });
}

export function SuggestedPromptCard({ assessment }: SuggestedPromptCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { sendMessage, isLoading: isSending } = useSendMessage();
  const { data: responses } = useAssessmentResponses(assessment?.id);
  const createPlan = useCreatePlan();
  const { data: existingPlans = [] } = usePlans();
  const { isFree } = useSubscription();
  const [isGenerating, setIsGenerating] = useState(false);

  const loading = isGenerating || isSending;

  const handleGenerate = async () => {
    // Free tier guard (admins/paid bypass)
    if (isFree && existingPlans.length >= 1) {
      toast({
        title: 'Plan limit reached',
        description: 'Free accounts are limited to 1 plan. Complete or delete your current plan first.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const plan = await autoGenerateStrategy({
        userId: user!.id,
        profile: profile ?? null,
        assessment,
        responses: responses ?? [],
        existingPlanNames: existingPlans.map((p) => p.strategy_name),
        sendMessage,
        createPlan: (input) => createPlan.mutateAsync(input),
      });

      // Navigate directly to the plan
      navigate(`/plans/${plan.id}`);
    } catch {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Your Personalized Strategy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Based on your full assessment — including your Deep Dive answers — we'll
          generate your single best next strategy and create an actionable plan
          you can start implementing right away.
        </p>
        <Button
          className="w-full bg-success hover:bg-success/90 text-white"
          size="lg"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Your Strategy…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate My Next Strategy
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
