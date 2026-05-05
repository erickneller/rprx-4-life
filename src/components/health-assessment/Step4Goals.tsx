import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useAssessmentStore } from '@/store/healthAssessmentStore';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const primaryGoals = [
  { value: 'weight-loss', label: 'Weight loss / fat loss' },
  { value: 'muscle-gain', label: 'Lean muscle gain' },
  { value: 'strength', label: 'Strength increase' },
  { value: 'bodybuilding', label: 'Size / bodybuilding' },
  { value: 'mobility', label: 'Mobility / flexibility' },
  { value: 'injury-recovery', label: 'Recovery from injury' },
  { value: 'injury-prevention', label: 'Preventing future injury' },
  { value: 'sport-training', label: 'Training for an event or sport' },
  { value: 'energy', label: 'Improve energy and focus' },
  { value: 'longevity', label: 'Healthy aging / longevity' },
  { value: 'other', label: 'Other' },
];

const obstacleOptions = [
  { value: 'time', label: 'Time' },
  { value: 'motivation', label: 'Motivation' },
  { value: 'pain', label: 'Pain or injury' },
  { value: 'not-sure', label: 'Not sure what to do' },
  { value: 'money', label: 'Money' },
  { value: 'other', label: 'Other' },
];

export function Step4Goals() {
  const { goals, setGoals, setCurrentStep } = useAssessmentStore();

  const [primaryGoal, setPrimaryGoal] = useState(goals.primaryGoal || '');
  const [otherGoal, setOtherGoal] = useState('');
  const [timeHorizon, setTimeHorizon] = useState(goals.timeHorizon || '');
  const [commitment, setCommitment] = useState<number[]>([goals.commitment || 3]);
  const [obstacles, setObstacles] = useState<string[]>(goals.obstacles || []);

  const isValid = primaryGoal && timeHorizon && obstacles.length > 0;

  const handleNext = () => {
    if (isValid) {
      setGoals({
        primaryGoal: primaryGoal === 'other' && otherGoal ? otherGoal : primaryGoal,
        timeHorizon,
        commitment: commitment[0],
        obstacles,
      });
      setCurrentStep(5);
    }
  };

  const toggleObstacle = (value: string) => {
    setObstacles((prev) => (prev.includes(value) ? prev.filter((o) => o !== value) : [...prev, value]));
  };

  const getCommitmentLabel = (value: number) => {
    const labels = ['Just curious', 'Somewhat interested', 'Ready to make changes', 'Very committed', 'All-in and ready to act now'];
    return labels[value - 1];
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4 py-12">
      <div className="max-w-2xl w-full space-y-6 animate-in fade-in duration-500">
        <div className="text-center space-y-2">
          <h2 className="font-display text-3xl font-bold text-foreground">Goals & Focus</h2>
          <p className="text-muted-foreground">Help us understand what you want to achieve</p>
        </div>

        <Card className="p-8 space-y-6 shadow-lg border-border">
          <div className="space-y-6">
            <div>
              <Label>What is your primary health goal?</Label>
              <RadioGroup value={primaryGoal} onValueChange={setPrimaryGoal} className="mt-2 space-y-2">
                {primaryGoals.map((goal) => (
                  <div key={goal.value} className="flex items-center space-x-3 border border-border rounded-lg p-3 hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value={goal.value} id={`goal-${goal.value}`} />
                    <Label htmlFor={`goal-${goal.value}`} className="cursor-pointer flex-1 font-normal">{goal.label}</Label>
                  </div>
                ))}
              </RadioGroup>
              {primaryGoal === 'other' && (
                <Input placeholder="Please specify your goal" value={otherGoal} onChange={(e) => setOtherGoal(e.target.value)} className="mt-3" />
              )}
            </div>

            <div>
              <Label htmlFor="timeHorizon">In the next 6-12 months, what is the most important outcome you'd like to see?</Label>
              <Input id="timeHorizon" placeholder="E.g., Lose 20 pounds and have more energy for my family" value={timeHorizon} onChange={(e) => setTimeHorizon(e.target.value)} className="mt-1.5" />
            </div>

            <div>
              <Label>How committed are you to making changes?</Label>
              <div className="mt-3 space-y-2">
                <Slider value={commitment} onValueChange={setCommitment} min={1} max={5} step={1} className="py-4" />
                <p className="text-sm text-center font-medium text-primary">{getCommitmentLabel(commitment[0])}</p>
              </div>
            </div>

            <div>
              <Label className="mb-3 block">What is your biggest obstacle right now? (Select all that apply)</Label>
              <div className="space-y-2">
                {obstacleOptions.map((obstacle) => (
                  <div key={obstacle.value} className="flex items-center space-x-3 border border-border rounded-lg p-3 hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => toggleObstacle(obstacle.value)}>
                    <Checkbox id={`obstacle-${obstacle.value}`} checked={obstacles.includes(obstacle.value)} onCheckedChange={() => toggleObstacle(obstacle.value)} />
                    <Label htmlFor={`obstacle-${obstacle.value}`} className="cursor-pointer flex-1 font-normal">{obstacle.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" size="lg" onClick={() => setCurrentStep(3)} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button size="lg" onClick={handleNext} disabled={!isValid} className="flex-1 bg-gradient-primary hover:opacity-90">
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
