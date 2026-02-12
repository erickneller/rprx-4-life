import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateAutoStrategyPrompt, type AssessmentResponseDetail } from '@/lib/promptGenerator';
import { useSendMessage } from '@/hooks/useSendMessage';
import { useProfile } from '@/hooks/useProfile';
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

      // Fetch questions to get text and category
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
  const [isGenerating, setIsGenerating] = useState(false);

  const loading = isGenerating || isSending;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const prompt = generateAutoStrategyPrompt(
        profile ?? null,
        assessment,
        responses ?? []
      );

      const result = await sendMessage({
        conversationId: null,
        userMessage: prompt,
      });

      if (result) {
        const horseman = assessment.primary_horseman || 'interest';
        navigate(`/strategy-assistant?c=${result.conversationId}&auto=1&horseman=${horseman}`);
      } else {
        toast({
          title: 'Generation failed',
          description: 'Could not generate strategies. Please try again.',
          variant: 'destructive',
        });
      }
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
        <CardTitle className="text-lg">Get Personalized Strategies</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Based on your profile and assessment results, we'll generate your top 3
          strategies ranked by ease of implementation and speed of results.
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
              Generating Strategies…
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate My Strategies
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
