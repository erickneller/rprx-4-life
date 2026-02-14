import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { SingleChoiceQuestion } from './SingleChoiceQuestion';
import { RangeSelectQuestion } from './RangeSelectQuestion';
import { MultiSelectQuestion } from './MultiSelectQuestion';
import { useDeepDiveQuestions, useExistingDeepDive, useSaveDeepDive } from '@/hooks/useDeepDive';
import { useProfile } from '@/hooks/useProfile';
import { calculateRPRxScore } from '@/lib/rprxScore';
import { getHorsemanLabel } from '@/lib/scoringEngine';
import type { HorsemanType } from '@/lib/scoringEngine';

interface DeepDiveWizardProps {
  primaryHorseman: HorsemanType;
  assessmentId: string;
}

export function DeepDiveWizard({ primaryHorseman, assessmentId }: DeepDiveWizardProps) {
  const { data: questions = [], isLoading } = useDeepDiveQuestions(primaryHorseman);
  const { data: existingDive } = useExistingDeepDive(assessmentId);
  const saveDeepDive = useSaveDeepDive();
  const { profile, updateProfile } = useProfile();

  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [completed, setCompleted] = useState(false);

  const alreadyCompleted = !!existingDive;

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const canAdvance = useMemo(() => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.id];
    if (!answer) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    return answer !== '';
  }, [currentQuestion, answers]);

  const handleAnswer = (value: string | string[]) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleSubmit = async () => {
    await saveDeepDive.mutateAsync({
      assessmentId,
      horsemanType: primaryHorseman,
      answers,
    });

    // Update RPRx score +75
    if (profile) {
      const currentScore = calculateRPRxScore(profile);
      const newScore = Math.min(currentScore + 75, 1000);
      await updateProfile.mutateAsync({ rprx_score: newScore });
    }

    setCompleted(true);
  };

  if (isLoading) return null;

  // Already completed state
  if (alreadyCompleted || completed) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
            <Check className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Deep Dive Complete!</h3>
            <p className="text-sm text-muted-foreground">
              {completed ? '+75 RPRx points earned! Your strategy recommendations have been enhanced.' : 'You\'ve already completed the Deep Dive for this assessment.'}
            </p>
          </div>
          {completed && (
            <Badge className="ml-auto bg-green-500/20 text-green-600 border-green-500/30">
              +75 pts
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  }

  // Not started state
  if (!started) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-[2px] rounded-lg">
        <Card className="border-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    🔓 Unlock Your Personalized Strategy
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Answer 5 quick questions about {getHorsemanLabel(primaryHorseman)} to get a detailed action plan
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 whitespace-nowrap">
                <Sparkles className="h-3 w-3 mr-1" />
                +75 RPRx
              </Badge>
            </div>
            <Button onClick={() => setStarted(true)} className="w-full">
              <Unlock className="h-4 w-4 mr-2" />
              Start Deep Dive
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active wizard
  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-[2px] rounded-lg">
      <Card className="border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Unlock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Deep Dive: {getHorsemanLabel(primaryHorseman)}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {totalQuestions}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-1.5 mt-2">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentQuestion && (
            <>
              <h2 className="text-lg font-semibold text-foreground leading-relaxed">
                {currentQuestion.question_text}
              </h2>

              {currentQuestion.question_type === 'single_choice' && (
                <SingleChoiceQuestion
                  options={currentQuestion.options}
                  value={answers[currentQuestion.id] as string | undefined}
                  onChange={(v) => handleAnswer(v)}
                />
              )}
              {currentQuestion.question_type === 'range_select' && (
                <RangeSelectQuestion
                  options={currentQuestion.options}
                  value={answers[currentQuestion.id] as string | undefined}
                  onChange={(v) => handleAnswer(v)}
                />
              )}
              {currentQuestion.question_type === 'multi_select' && (
                <MultiSelectQuestion
                  options={currentQuestion.options}
                  value={answers[currentQuestion.id] as string[] | undefined}
                  onChange={(v) => handleAnswer(v)}
                />
              )}
            </>
          )}

          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            {currentIndex < totalQuestions - 1 ? (
              <Button onClick={handleNext} disabled={!canAdvance}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canAdvance || saveDeepDive.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saveDeepDive.isPending ? 'Saving...' : 'Complete Deep Dive'}
                <Check className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
