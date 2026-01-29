import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader2, Home, RotateCcw } from 'lucide-react';
import { HorsemenRadarChart } from './HorsemenRadarChart';
import { PrimaryHorsemanCard } from './PrimaryHorsemanCard';
import { CashFlowIndicator } from './CashFlowIndicator';
import { DiagnosticFeedback } from './DiagnosticFeedback';
import { useAssessmentById } from '@/hooks/useAssessmentHistory';
import type { HorsemanScores, HorsemanType } from '@/lib/scoringEngine';
import type { CashFlowStatus } from '@/lib/cashFlowCalculator';

export function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: assessment, isLoading, error } = useAssessmentById(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Assessment not found.</p>
        <Button onClick={() => navigate('/dashboard')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const scores: HorsemanScores = {
    interest: assessment.interest_score,
    taxes: assessment.taxes_score,
    insurance: assessment.insurance_score,
    education: assessment.education_score,
  };

  const primaryHorseman = assessment.primary_horseman as HorsemanType;
  const cashFlowStatus = assessment.cash_flow_status as CashFlowStatus | null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Your Assessment Results
          </h1>
          <p className="text-foreground mt-1">
            Here's what we found about your financial pressure points
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Radar Chart */}
        <section>
        <h2 className="text-xl font-semibold text-foreground mb-4 text-center">
            The Four Horsemen Of Financial Apocalypse
          </h2>
          <HorsemenRadarChart scores={scores} primaryHorseman={primaryHorseman} />
        </section>

        {/* Primary Horseman & Cash Flow */}
        <section className="grid md:grid-cols-2 gap-4">
          <PrimaryHorsemanCard primaryHorseman={primaryHorseman} />
          {cashFlowStatus && <CashFlowIndicator status={cashFlowStatus} />}
        </section>

        {/* Diagnostic Feedback */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Understanding Your Results
          </h2>
          <DiagnosticFeedback primaryHorseman={primaryHorseman} />
        </section>

        {/* Action Buttons */}
        <section className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/dashboard')}
          >
            <Home className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
          <Button
            className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={() => navigate('/assessment')}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Take New Assessment
          </Button>
        </section>
      </main>
    </div>
  );
}
