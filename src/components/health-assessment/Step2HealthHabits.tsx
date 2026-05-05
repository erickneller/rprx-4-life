import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { useAssessmentStore } from '@/store/healthAssessmentStore';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const smokingOptions = [
  { value: 'never', label: 'Never' },
  { value: 'used-to', label: 'Used to' },
  { value: 'yes', label: 'Yes, regularly' },
];

const alcoholOptions = [
  { value: 'never', label: 'Never' },
  { value: 'rarely', label: 'Rarely' },
  { value: '1-2x-week', label: '1-2x per week' },
  { value: '3-5x-week', label: '3-5x per week' },
  { value: 'almost-daily', label: 'Almost daily' },
];

export function Step2HealthHabits() {
  const { healthHabits, setHealthHabits, setCurrentStep } = useAssessmentStore();

  const [overallHealth, setOverallHealth] = useState<number[]>([healthHabits.overallHealth || 3]);
  const [energy, setEnergy] = useState<number[]>([healthHabits.energy || 3]);
  const [sleep, setSleep] = useState<number[]>([healthHabits.sleep || 3]);
  const [stress, setStress] = useState<number[]>([healthHabits.stress || 3]);
  const [exerciseDays, setExerciseDays] = useState<number[]>([healthHabits.exerciseDays || 0]);
  const [healthyEatingDays, setHealthyEatingDays] = useState<number[]>([healthHabits.healthyEatingDays || 0]);
  const [smoking, setSmoking] = useState(healthHabits.smoking || '');
  const [alcohol, setAlcohol] = useState(healthHabits.alcohol || '');

  const isValid = smoking && alcohol;

  const handleNext = () => {
    if (isValid) {
      setHealthHabits({
        overallHealth: overallHealth[0],
        energy: energy[0],
        sleep: sleep[0],
        stress: stress[0],
        exerciseDays: exerciseDays[0],
        healthyEatingDays: healthyEatingDays[0],
        smoking,
        alcohol,
      });
      setCurrentStep(3);
    }
  };

  const getScaleLabel = (value: number, type: 'health' | 'energy' | 'sleep' | 'stress') => {
    const labels = {
      health: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'],
      energy: ['Very Low', 'Low', 'Moderate', 'High', 'Very High'],
      sleep: ['Very Poorly', 'Poorly', 'Fair', 'Well', 'Very Well'],
      stress: ['Almost Never', 'Rarely', 'Sometimes', 'Often', 'Almost Always'],
    };
    return labels[type][value - 1];
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6 animate-in fade-in duration-500">
        <div className="text-center space-y-2">
          <h2 className="font-display text-3xl font-bold text-foreground">Health & Habits</h2>
          <p className="text-muted-foreground">Tell us about your daily health patterns</p>
        </div>

        <Card className="p-8 space-y-6 shadow-lg border-border">
          <div className="space-y-6">
            {[
              { label: 'How would you rate your overall health?', val: overallHealth, set: setOverallHealth, type: 'health' as const },
              { label: 'How much daily energy do you typically feel?', val: energy, set: setEnergy, type: 'energy' as const },
              { label: 'How well do you sleep most nights?', val: sleep, set: setSleep, type: 'sleep' as const },
              { label: 'How often do you feel stressed?', val: stress, set: setStress, type: 'stress' as const },
            ].map((s) => (
              <div key={s.label}>
                <Label>{s.label}</Label>
                <div className="mt-3 space-y-2">
                  <Slider value={s.val} onValueChange={s.set} min={1} max={5} step={1} className="py-4" />
                  <p className="text-sm text-center font-medium text-primary">{getScaleLabel(s.val[0], s.type)}</p>
                </div>
              </div>
            ))}

            <div>
              <Label>Days per week you do at least 30 minutes of intentional exercise</Label>
              <div className="mt-3 space-y-2">
                <Slider value={exerciseDays} onValueChange={setExerciseDays} min={0} max={7} step={1} className="py-4" />
                <p className="text-sm text-center font-medium text-primary">{exerciseDays[0]} days per week</p>
              </div>
            </div>

            <div>
              <Label>Days per week you eat mostly whole, minimally processed foods</Label>
              <div className="mt-3 space-y-2">
                <Slider value={healthyEatingDays} onValueChange={setHealthyEatingDays} min={0} max={7} step={1} className="py-4" />
                <p className="text-sm text-center font-medium text-primary">{healthyEatingDays[0]} days per week</p>
              </div>
            </div>

            <div>
              <Label>Do you currently smoke or vape?</Label>
              <RadioGroup value={smoking} onValueChange={setSmoking} className="mt-2 space-y-2">
                {smokingOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 border border-border rounded-lg p-3 hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value={option.value} id={`smoke-${option.value}`} />
                    <Label htmlFor={`smoke-${option.value}`} className="cursor-pointer flex-1 font-normal">{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label>How often do you drink alcohol?</Label>
              <RadioGroup value={alcohol} onValueChange={setAlcohol} className="mt-2 space-y-2">
                {alcoholOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 border border-border rounded-lg p-3 hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value={option.value} id={`alcohol-${option.value}`} />
                    <Label htmlFor={`alcohol-${option.value}`} className="cursor-pointer flex-1 font-normal">{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" size="lg" onClick={() => setCurrentStep(1)} className="flex-1">
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
