import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { QuizData } from '@/lib/onboardingEngine';

interface OnboardingQuizProps {
  quizData: QuizData;
  onComplete: (answers: Record<string, string>) => void;
  isSubmitting: boolean;
  existingAnswers?: Record<string, string>;
}

export function OnboardingQuiz({ quizData, onComplete, isSubmitting, existingAnswers }: OnboardingQuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(existingAnswers || {});
  const [submitted, setSubmitted] = useState(!!existingAnswers);

  const allAnswered = quizData.questions.every((_, i) => answers[String(i)]);

  const handleSubmit = () => {
    setSubmitted(true);
    onComplete(answers);
  };

  return (
    <div className="space-y-6">
      {quizData.questions.map((q, i) => {
        const key = String(i);
        const userAnswer = answers[key];
        const isCorrect = submitted && userAnswer === q.correct;
        const isWrong = submitted && userAnswer && userAnswer !== q.correct;

        return (
          <div key={i} className="space-y-3">
            <p className="font-medium text-sm">{q.question}</p>
            <RadioGroup
              value={userAnswer || ''}
              onValueChange={(v) => !submitted && setAnswers(prev => ({ ...prev, [key]: v }))}
              disabled={submitted}
            >
              {q.options.map((opt) => {
                const isThisCorrect = submitted && opt.value === q.correct;
                const isThisWrong = submitted && opt.value === userAnswer && userAnswer !== q.correct;

                return (
                  <div
                    key={opt.value}
                    className={`flex items-center gap-2 rounded-lg border p-3 transition-colors ${
                      isThisCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950/30' :
                      isThisWrong ? 'border-red-500 bg-red-50 dark:bg-red-950/30' :
                      ''
                    }`}
                  >
                    <RadioGroupItem value={opt.value} id={`q${i}-${opt.value}`} />
                    <Label htmlFor={`q${i}-${opt.value}`} className="flex-1 cursor-pointer text-sm">
                      {opt.label}
                    </Label>
                    {isThisCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {isThisWrong && <XCircle className="h-4 w-4 text-red-500" />}
                  </div>
                );
              })}
            </RadioGroup>
            {submitted && isWrong && (
              <p className="text-xs text-muted-foreground">
                The correct answer earns full points, but you still earn partial credit for trying!
              </p>
            )}
          </div>
        );
      })}

      {!submitted && (
        <Button
          onClick={handleSubmit}
          disabled={!allAnswered || isSubmitting}
          className="w-full"
        >
          Submit Answers
        </Button>
      )}
    </div>
  );
}
