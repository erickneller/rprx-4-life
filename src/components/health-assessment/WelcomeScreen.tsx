import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Activity, CheckCircle2, FileText, Info } from 'lucide-react';
import { useAssessmentStore, Persona } from '@/store/healthAssessmentStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const personas: { value: Persona; label: string }[] = [
  { value: 'business-owner', label: 'Business Owner' },
  { value: 'retiree', label: 'Retiree / Grandparent' },
  { value: 'salesperson', label: 'Salesperson' },
  { value: 'wage-earner', label: 'W2 Employee' },
  { value: 'investor', label: 'Investor' },
  { value: 'farmer', label: 'Farmer' },
  { value: 'non-profit', label: 'Non-Profit Leader / Staff' },
  { value: 'other', label: 'Other / Prefer not to say' },
];

export function WelcomeScreen() {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const { setPersona, setCurrentStep } = useAssessmentStore();

  const handleStart = () => {
    if (selectedPersona) {
      setPersona(selectedPersona);
      setCurrentStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-8 animate-in fade-in duration-700">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <Activity className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-display text-5xl font-bold tracking-tight text-foreground">
            RPRx Health Assessment
          </h1>
          <p className="text-2xl text-muted-foreground">How Healthy Are You Really?</p>
          <p className="text-lg text-foreground max-w-2xl mx-auto">
            Answer a few quick questions to see your current RPRx Health Score, how much RPRx could
            improve your health, and get a personalized action plan.
          </p>
        </div>

        <Card className="p-8 space-y-6 shadow-lg border-border">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-medium text-foreground">Takes 3–5 minutes</p>
                <p className="text-sm text-muted-foreground">Quick and easy assessment</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-medium text-foreground">No medical details</p>
                <p className="text-sm text-muted-foreground">Just general habits and goals</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-medium text-foreground">Personalized plan</p>
                <p className="text-sm text-muted-foreground">Guided checklist for next steps</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <Label className="text-base font-semibold mb-4 block">Which best describes you?</Label>
            <RadioGroup value={selectedPersona || ''} onValueChange={(value) => setSelectedPersona(value as Persona)}>
              <div className="grid gap-3 md:grid-cols-2">
                {personas.map((persona) => (
                  <div key={persona.value} className="flex items-center space-x-3 border border-border rounded-lg p-3 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <RadioGroupItem value={persona.value} id={persona.value} />
                    <Label htmlFor={persona.value} className="cursor-pointer flex-1">
                      {persona.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <Button
            size="lg"
            className="w-full text-lg h-14 bg-gradient-primary hover:opacity-90 transition-opacity"
            onClick={handleStart}
            disabled={!selectedPersona}
          >
            <FileText className="mr-2 h-5 w-5" />
            Start My Health Assessment
          </Button>

          <div className="text-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="link" className="text-primary">
                  <Info className="mr-2 h-4 w-4" />
                  What is RPRx?
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>About RPRx</DialogTitle>
                  <DialogDescription className="text-base space-y-3 pt-4">
                    <p>
                      RPRx is a holistic financial and health wellness system designed to help you{' '}
                      <strong>Reduce, Pay, and Recover</strong> from life's unexpected events.
                    </p>
                    <p>
                      We integrate preventive health screenings, lifestyle optimization, and financial
                      protection strategies to ensure that health events don't become financial disasters.
                    </p>
                    <p>
                      Our certified RPRx Advisors work with you to create a personalized plan that
                      improves your quality of life while protecting your income and assets.
                    </p>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      </div>
    </div>
  );
}
