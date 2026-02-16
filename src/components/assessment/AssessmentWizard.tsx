import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { ProgressIndicator } from './ProgressIndicator';
import { QuestionCard } from './QuestionCard';
import { SingleChoiceQuestion } from './SingleChoiceQuestion';
import { RangeSelectQuestion } from './RangeSelectQuestion';
import { MultiSelectQuestion } from './MultiSelectQuestion';
import { ExitAssessmentDialog } from './ExitAssessmentDialog';
import { useAssessmentQuestions } from '@/hooks/useAssessmentQuestions';
import { useAssessment } from '@/hooks/useAssessment';
import { getHorsemanLabel } from '@/lib/scoringEngine';

export function AssessmentWizard() {
  const navigate = useNavigate();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const { data: questions = [], isLoading: questionsLoading } = useAssessmentQuestions();

  const {
    phase,
    calculatedHorseman,
    currentStep,
    currentQuestion,
    totalSteps,
    progress,
    responses,
    isSubmitting,
    isLastCoreStep,
    setResponse,
    deepDiveQuestions,
    currentDeepDiveQuestion,
    deepDiveStep,
    totalDeepDiveSteps,
    deepDiveAnswers,
    isLastDeepDiveStep,
    setDeepDiveAnswer,
    goToNext,
    goToPrevious,
    canGoNext,
    isLastStep,
    transitionToDeepDive,
    startDeepDive,
    submitAssessment,
  } = useAssessment(questions);

  if (questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (phase === 'core' && !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">No questions available.</p>
      </div>
    );
  }

  const handleNext = () => {
    if (phase === 'core' && isLastCoreStep) {
      transitionToDeepDive();
    } else if (phase === 'deep_dive' && isLastStep) {
      submitAssessment();
    } else {
      goToNext();
    }
  };

  // Transition screen between core and deep dive
  if (phase === 'transition') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExitDialog(true)}
              className="mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Exit Assessment
            </Button>
            <ExitAssessmentDialog
              open={showExitDialog}
              onContinue={() => setShowExitDialog(false)}
              onExit={() => navigate('/dashboard')}
            />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <Card className="max-w-lg w-full">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Great progress!</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Your biggest financial pressure is{' '}
                  <span className="font-semibold text-foreground">
                    {calculatedHorseman ? getHorsemanLabel(calculatedHorseman) : '...'}
                  </span>
                  . Let's personalize your strategy with {totalDeepDiveSteps > 0 ? totalDeepDiveSteps : 5} quick follow-up questions.
                </p>
              </div>
              <Button
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={startDeepDive}
                disabled={deepDiveQuestions.length === 0}
              >
                {deepDiveQuestions.length === 0 ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading questions...
                  </>
                ) : (
                  'Continue to Deep Dive'
                )}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Deep dive phase
  if (phase === 'deep_dive' && currentDeepDiveQuestion) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExitDialog(true)}
              className="mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Exit Assessment
            </Button>
            <ExitAssessmentDialog
              open={showExitDialog}
              onContinue={() => setShowExitDialog(false)}
              onExit={() => navigate('/dashboard')}
            />
            <ProgressIndicator
              currentStep={questions.length + deepDiveStep}
              totalSteps={totalSteps}
              progress={progress}
            />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl space-y-6">
            <div className="text-center">
              <span className="text-xs font-medium text-primary uppercase tracking-wider">
                Deep Dive: {calculatedHorseman ? getHorsemanLabel(calculatedHorseman) : ''}
              </span>
            </div>
            <Card>
              <CardContent className="p-6 space-y-6">
                <h2 className="text-lg font-semibold text-foreground leading-relaxed">
                  {currentDeepDiveQuestion.question_text}
                </h2>

                {currentDeepDiveQuestion.question_type === 'single_choice' && (
                  <SingleChoiceQuestion
                    options={currentDeepDiveQuestion.options}
                    value={deepDiveAnswers[currentDeepDiveQuestion.id] as string | undefined}
                    onChange={(v) => setDeepDiveAnswer(currentDeepDiveQuestion.id, v)}
                  />
                )}
                {currentDeepDiveQuestion.question_type === 'range_select' && (
                  <RangeSelectQuestion
                    options={currentDeepDiveQuestion.options}
                    value={deepDiveAnswers[currentDeepDiveQuestion.id] as string | undefined}
                    onChange={(v) => setDeepDiveAnswer(currentDeepDiveQuestion.id, v)}
                  />
                )}
                {currentDeepDiveQuestion.question_type === 'multi_select' && (
                  <MultiSelectQuestion
                    options={currentDeepDiveQuestion.options}
                    value={deepDiveAnswers[currentDeepDiveQuestion.id] as string[] | undefined}
                    onChange={(v) => setDeepDiveAnswer(currentDeepDiveQuestion.id, v)}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        <footer className="border-t border-border px-4 py-4">
          <div className="max-w-4xl mx-auto flex justify-between">
            <Button
              variant="outline"
              onClick={goToPrevious}
              disabled={deepDiveStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canGoNext() || isSubmitting}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : isLastStep ? (
                'Complete Assessment'
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </footer>
      </div>
    );
  }

  // Core phase (original wizard)
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExitDialog(true)}
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Exit Assessment
          </Button>
          <ExitAssessmentDialog
            open={showExitDialog}
            onContinue={() => setShowExitDialog(false)}
            onExit={() => navigate('/dashboard')}
          />
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            progress={progress}
          />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            value={responses[currentQuestion.id]}
            onChange={(value) => setResponse(currentQuestion.id, value)}
          />
        )}
      </main>
      <footer className="border-t border-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex justify-between">
          <Button
            variant="outline"
            onClick={goToPrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canGoNext()}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isLastCoreStep ? (
              'Continue →'
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
