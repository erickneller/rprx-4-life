import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAssessmentStore, Persona } from '@/store/healthAssessmentStore';
import { calculateHealthScore, HealthScore } from '@/utils/health/scoring';
import { Download, TrendingUp, Activity, Shield, CheckCircle2 } from 'lucide-react';
import { generatePDF } from '@/utils/health/pdfGenerator';
import { toast } from 'sonner';

const personaInsights: Record<Persona, string> = {
  'business-owner': 'As a business owner, protecting your ability to work and maintaining peak performance is critical.',
  retiree: 'As a retiree, maintaining mobility, energy, and quality of life keeps you active with loved ones.',
  salesperson: 'As a salesperson, your energy and mental sharpness are competitive advantages. Protecting your health protects your income.',
  'wage-earner': "As a wage earner, your ability to work is your most valuable asset.",
  investor: 'As an investor, maintaining clarity, focus, and longevity helps you make better decisions.',
  farmer: 'As a farmer, your physical capabilities and stamina are central to your livelihood.',
  'non-profit': 'As a non-profit leader, your wellbeing allows you to serve your mission sustainably.',
  other: 'Your health is your foundation for everything you do.',
};

export function ResultsScreen() {
  const store = useAssessmentStore();
  const [scores, setScores] = useState<HealthScore | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    setScores(calculateHealthScore(store.basicProfile, store.healthHabits, store.screenings, store.goals));
  }, [store]);

  const handleDownloadPDF = async () => {
    if (!scores) return;
    setIsGeneratingPDF(true);
    try {
      await generatePDF(store, scores);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!scores) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const readinessConfig = {
    great: { label: 'Great Foundation', color: 'text-primary', bg: 'bg-primary/10', message: 'You have a solid health foundation.' },
    high: { label: 'High Potential', color: 'text-accent', bg: 'bg-accent/10', message: 'You have significant opportunities for rapid health improvement.' },
    critical: { label: 'Critical Gaps', color: 'text-destructive', bg: 'bg-destructive/10', message: 'Immediate attention to key health areas is recommended.' },
  };

  const readiness = readinessConfig[scores.readiness];
  const personaInsight = store.persona ? personaInsights[store.persona] : personaInsights.other;

  return (
    <div className="min-h-screen bg-gradient-subtle py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
        <div className="text-center space-y-4">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">Your RPRx Health Assessment Results</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {store.contact.firstName}, here's your personalized health snapshot
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 text-center space-y-4 shadow-lg border-2 border-primary/20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2">
              <Activity className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">Current RPRx Health Score</p>
            <p className="text-6xl font-display font-bold text-primary">{scores.current}</p>
            <p className="text-lg text-muted-foreground">out of 100</p>
          </Card>

          <Card className="p-8 text-center space-y-4 shadow-lg border-2 border-accent/20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-2">
              <TrendingUp className="w-8 h-8 text-accent" />
            </div>
            <p className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">RPRx Improvement Potential</p>
            <p className="text-6xl font-display font-bold text-accent">+{scores.improvement}</p>
            <p className="text-lg text-muted-foreground">potential points</p>
          </Card>
        </div>

        <Card className={`p-6 ${readiness.bg} border-none`}>
          <div className="flex items-center gap-4">
            <Shield className={`w-12 h-12 ${readiness.color}`} />
            <div className="flex-1">
              <h3 className={`text-xl font-bold ${readiness.color}`}>{readiness.label}</h3>
              <p className="text-foreground">{readiness.message}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-primary text-primary-foreground shadow-lg">
          <p className="text-lg leading-relaxed">{personaInsight}</p>
        </Card>

        <Card className="p-8 bg-gradient-accent text-accent-foreground shadow-lg text-center space-y-4">
          <h3 className="font-display text-2xl font-bold">Ready to Take Action?</h3>
          <p className="text-lg max-w-2xl mx-auto">
            Talk to your certified RPRx Advisor to build a customized plan to improve your health and protect your income.
          </p>
          <Button size="lg" onClick={handleDownloadPDF} disabled={isGeneratingPDF} className="bg-background text-foreground hover:bg-background/90 shadow-md">
            <Download className="mr-2 h-5 w-5" />
            {isGeneratingPDF ? 'Generating PDF...' : 'Download My RPRx Health Summary'}
          </Button>
        </Card>

        <Card className="p-6 bg-muted/50 border-muted">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            <strong>Important Disclaimer:</strong> This assessment is for educational purposes only and does not constitute medical advice. Always consult with your healthcare provider.
          </p>
        </Card>
      </div>
    </div>
  );
}
