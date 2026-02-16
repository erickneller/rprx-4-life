import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateAutoStrategyPrompt, type AssessmentResponseDetail } from '@/lib/promptGenerator';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useProfile } from '@/hooks/useProfile';
import { useCreatePlan, usePlans } from '@/hooks/usePlans';
import { parseStrategyFromMessage } from '@/lib/strategyParser';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { UserAssessment } from '@/lib/assessmentTypes';

interface SuggestedPromptCardProps {
  assessment: UserAssessment;
}

const HORSEMAN_LABELS: Record<string, string> = {
  interest: 'Interest & Debt',
  taxes: 'Tax Efficiency',
  insurance: 'Insurance & Protection',
  education: 'Education Funding',
};

function getAutoPlanTitle(horseman: string | null | undefined): string {
  const label = HORSEMAN_LABELS[horseman || 'interest'] || 'Financial Strategy';
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'short' });
  const year = now.getFullYear();
  return `${label} - ${month} ${year}`;
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
  const { profile } = useProfile();
  const { sendMessage, isLoading: isSending } = useSendMessage();
  const { data: responses } = useAssessmentResponses(assessment?.id);
  const createPlan = useCreatePlan();
  const { data: existingPlans = [] } = usePlans();
  const [isGenerating, setIsGenerating] = useState(false);

  const loading = isGenerating || isSending;

  const handleGenerate = async () => {
    // Free tier guard
    const isFree = true;
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
      // Build prompt requesting 1 strategy
      const prompt = generateAutoStrategyPrompt(
        profile ?? null,
        assessment,
        responses ?? [],
        existingPlans.map((p) => p.strategy_name)
      );

      // Send prompt and get AI response
      const result = await sendMessage({
        conversationId: null,
        userMessage: prompt,
      });

      if (!result) {
        toast({
          title: 'Generation failed',
          description: 'Could not generate a strategy. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Send follow-up for detailed steps
      const followUp = await sendMessage({
        conversationId: result.conversationId,
        userMessage: 'Please provide the detailed step-by-step implementation plan for the strategy above. Include numbered steps I can check off as I complete them.',
      });

      const messageContent = followUp?.assistantMessage || result.assistantMessage;

      // Parse the strategy from the response
      const parsed = parseStrategyFromMessage(messageContent, true);
      const horseman = assessment.primary_horseman || 'interest';

      const planTitle = getAutoPlanTitle(horseman);
      const planData = parsed
        ? {
            title: planTitle,
            strategy_name: parsed.strategyName,
            strategy_id: parsed.strategyId,
            content: parsed.content,
          }
        : {
            title: planTitle,
            strategy_name: 'Implementation Plan',
            content: {
              steps: extractStepsFromContent(messageContent),
              summary: messageContent.substring(0, 500),
              disclaimer: 'This information is for educational purposes only and does not constitute tax, legal, or financial advice.',
              completedSteps: [] as number[],
            },
          };

      // Auto-save the plan
      const plan = await createPlan.mutateAsync(planData);

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

function extractStepsFromContent(content: string): string[] {
  const metadataPattern = /^\*\*[^*]+\*\*[:]/;
  const steps = content
    .split('\n')
    .filter((line: string) => /^\s*\d+\.\s+/.test(line))
    .map((line: string) => line.replace(/^\s*\d+\.\s+/, '').trim())
    .filter((s: string) => s.length > 10 && !metadataPattern.test(s))
    .slice(0, 20);

  if (steps.length < 2) {
    const bulletSteps = content
      .split('\n')
      .filter((line: string) => /^\s*[-•]\s+/.test(line) && !metadataPattern.test(line.replace(/^\s*[-•]\s+/, '')))
      .map((line: string) => line.replace(/^\s*[-•]\s+/, '').trim())
      .filter((s: string) => s.length > 10);
    if (bulletSteps.length > steps.length) {
      return bulletSteps.slice(0, 20);
    }
  }

  if (steps.length === 0) {
    return ['Review the strategy details and take action.'];
  }

  return steps;
}
