import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getFeedback, compoundingExplanation } from '@/lib/feedbackEngine';
import type { HorsemanType } from '@/lib/scoringEngine';

interface DiagnosticFeedbackProps {
  primaryHorseman: HorsemanType;
}

export function DiagnosticFeedback({ primaryHorseman }: DiagnosticFeedbackProps) {
  const feedback = getFeedback(primaryHorseman);

  return (
    <div className="space-y-6">
      {/* Primary Horseman Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-primary">{feedback.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground leading-relaxed">{feedback.intro}</p>

          <div>
            <h4 className="font-semibold text-foreground mb-2">What This Means</h4>
            <p className="text-foreground leading-relaxed">
              {feedback.whatItMeans}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-2">Why It Matters</h4>
            <p className="text-foreground leading-relaxed">
              {feedback.whyItMatters}
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Compounding Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{compoundingExplanation.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed whitespace-pre-line">
            {compoundingExplanation.content}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
