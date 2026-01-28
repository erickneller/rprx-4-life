import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { ProgressIndicator } from './ProgressIndicator';
import { QuestionCard } from './QuestionCard';
import { useAssessmentQuestions } from '@/hooks/useAssessmentQuestions';
import { useAssessment } from '@/hooks/useAssessment';

export function AssessmentWizard() {
  const navigate = useNavigate();
  const { data: questions = [], isLoading: questionsLoading } = useAssessmentQuestions();

  const {
    currentStep,
    currentQuestion,
    totalSteps,
    progress,
    responses,
    isSubmitting,
    isLastStep,
    setResponse,
    goToNext,
    goToPrevious,
    canGoNext,
    submitAssessment,
  } = useAssessment(questions);

  if (questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">No questions available.</p>
      </div>
    );
  }

  const handleNext = () => {
    if (isLastStep) {
      submitAssessment();
    } else {
      goToNext();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Exit Assessment
          </Button>
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            progress={progress}
          />
        </div>
      </header>

      {/* Question Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <QuestionCard
          question={currentQuestion}
          value={responses[currentQuestion.id]}
          onChange={(value) => setResponse(currentQuestion.id, value)}
        />
      </main>

      {/* Navigation Footer */}
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
            disabled={!canGoNext() || isSubmitting}
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
