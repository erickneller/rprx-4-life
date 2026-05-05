import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAssessmentStore } from '@/store/healthAssessmentStore';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const lifestyleOptions = [
  { value: 'sedentary', label: 'Mostly desk / sedentary' },
  { value: 'light', label: 'Mix of sitting and light movement' },
  { value: 'active', label: 'Active job (on feet most of the day)' },
  { value: 'demanding', label: 'Very physically demanding job' },
];

export function Step1BasicProfile() {
  const { basicProfile, setBasicProfile, setCurrentStep } = useAssessmentStore();

  const [age, setAge] = useState(basicProfile.age?.toString() || '');
  const [sex, setSex] = useState(basicProfile.sex || '');
  const [heightFeet, setHeightFeet] = useState(basicProfile.heightFeet?.toString() || '');
  const [heightInches, setHeightInches] = useState(basicProfile.heightInches?.toString() || '');
  const [weight, setWeight] = useState(basicProfile.weight?.toString() || '');
  const [lifestyle, setLifestyle] = useState(basicProfile.lifestyle || '');

  const isValid = age && sex && heightFeet && heightInches && weight && lifestyle;

  const handleNext = () => {
    if (isValid) {
      setBasicProfile({
        age: parseInt(age),
        sex: sex as 'male' | 'female' | 'prefer-not-to-say',
        heightFeet: parseInt(heightFeet),
        heightInches: parseInt(heightInches),
        weight: parseInt(weight),
        lifestyle,
      });
      setCurrentStep(2);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6 animate-in fade-in duration-500">
        <div className="text-center space-y-2">
          <h2 className="font-display text-3xl font-bold text-foreground">Basic Profile</h2>
          <p className="text-muted-foreground">Let's start with some basic information about you</p>
        </div>

        <Card className="p-8 space-y-6 shadow-lg border-border">
          <div className="space-y-4">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input id="age" type="number" min="18" max="90" placeholder="Enter your age" value={age} onChange={(e) => setAge(e.target.value)} className="mt-1.5" />
            </div>

            <div>
              <Label>Sex</Label>
              <RadioGroup value={sex} onValueChange={setSex} className="mt-1.5">
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="cursor-pointer font-normal">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="cursor-pointer font-normal">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="prefer-not-to-say" id="prefer-not-to-say" />
                    <Label htmlFor="prefer-not-to-say" className="cursor-pointer font-normal">Prefer not to say</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Height</Label>
              <div className="flex gap-3 mt-1.5">
                <div className="flex-1">
                  <Input type="number" min="3" max="8" placeholder="Feet" value={heightFeet} onChange={(e) => setHeightFeet(e.target.value)} />
                </div>
                <div className="flex-1">
                  <Input type="number" min="0" max="11" placeholder="Inches" value={heightInches} onChange={(e) => setHeightInches(e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="weight">Approximate Weight (pounds)</Label>
              <Input id="weight" type="number" min="50" max="500" placeholder="Enter your weight" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1.5" />
            </div>

            <div>
              <Label>Current work/lifestyle pattern</Label>
              <RadioGroup value={lifestyle} onValueChange={setLifestyle} className="mt-1.5 space-y-2">
                {lifestyleOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 border border-border rounded-lg p-3 hover:bg-secondary/50 transition-colors">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="cursor-pointer flex-1 font-normal">{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" size="lg" onClick={() => setCurrentStep(0)} className="flex-1">
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
