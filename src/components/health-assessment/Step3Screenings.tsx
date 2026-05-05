import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAssessmentStore } from '@/store/healthAssessmentStore';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export function Step3Screenings() {
  const { screenings, setScreenings, setCurrentStep, basicProfile } = useAssessmentStore();

  const [bloodPressureCheck, setBloodPressureCheck] = useState(screenings.bloodPressureCheck || '');
  const [bloodPressureHigh, setBloodPressureHigh] = useState(screenings.bloodPressureHigh || '');
  const [cholesterolCheck, setCholesterolCheck] = useState(screenings.cholesterolCheck || '');
  const [diabetesRisk, setDiabetesRisk] = useState(screenings.diabetesRisk || '');
  const [dentistVisits, setDentistVisits] = useState(screenings.dentistVisits || '');
  const [eyeExam, setEyeExam] = useState(screenings.eyeExam || '');
  const [papTest, setPapTest] = useState(screenings.papTest || '');
  const [breastCancerDiscussion, setBreastCancerDiscussion] = useState(screenings.breastCancerDiscussion || '');
  const [hepCHIVScreening, setHepCHIVScreening] = useState(screenings.hepCHIVScreening || '');
  const [selfExams, setSelfExams] = useState(screenings.selfExams || '');
  const [disabilityInsurance, setDisabilityInsurance] = useState(screenings.disabilityInsurance || '');
  const [lifeInsurance, setLifeInsurance] = useState(screenings.lifeInsurance || '');

  const isFemale = basicProfile.sex === 'female';
  const age = basicProfile.age || 0;

  const isValid =
    bloodPressureCheck && bloodPressureHigh && cholesterolCheck && diabetesRisk && dentistVisits && eyeExam &&
    hepCHIVScreening && selfExams && disabilityInsurance && lifeInsurance &&
    (!isFemale || !age || age < 21 || (papTest && breastCancerDiscussion));

  const handleNext = () => {
    if (isValid) {
      setScreenings({
        bloodPressureCheck,
        bloodPressureHigh,
        cholesterolCheck,
        diabetesRisk,
        dentistVisits,
        eyeExam,
        ...(isFemale && age >= 21 && { papTest, breastCancerDiscussion }),
        hepCHIVScreening,
        selfExams,
        disabilityInsurance,
        lifeInsurance,
      });
      setCurrentStep(4);
    }
  };

  const Q = ({ label, value, onChange, options, prefix }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; prefix: string }) => (
    <div>
      <Label>{label}</Label>
      <RadioGroup value={value} onValueChange={onChange} className="mt-2 space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-3 border border-border rounded-lg p-3 hover:bg-secondary/50 transition-colors">
            <RadioGroupItem value={option.value} id={`${prefix}-${option.value}`} />
            <Label htmlFor={`${prefix}-${option.value}`} className="cursor-pointer flex-1 font-normal">{option.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4 py-12">
      <div className="max-w-2xl w-full space-y-6 animate-in fade-in duration-500">
        <div className="text-center space-y-2">
          <h2 className="font-display text-3xl font-bold text-foreground">Screenings & Prevention</h2>
          <p className="text-muted-foreground">Help us understand your preventive health practices</p>
        </div>

        <Card className="p-8 space-y-6 shadow-lg border-border">
          <div className="space-y-5">
            <Q label="When was your last blood pressure check?" value={bloodPressureCheck} onChange={setBloodPressureCheck} prefix="bp-check" options={[
              { value: 'within-year', label: 'Within the last year' },
              { value: '1-3-years', label: '1-3 years ago' },
              { value: 'more-than-3', label: 'More than 3 years ago' },
              { value: 'unsure', label: "I'm not sure" },
            ]} />
            <Q label="Have you ever been told your blood pressure was high (above 130/80)?" value={bloodPressureHigh} onChange={setBloodPressureHigh} prefix="bp-high" options={[
              { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unsure', label: 'Unsure' },
            ]} />
            <Q label="When was your last cholesterol check?" value={cholesterolCheck} onChange={setCholesterolCheck} prefix="chol" options={[
              { value: 'within-5-years', label: 'Within the last 5 years' },
              { value: 'more-than-5', label: 'More than 5 years ago' },
              { value: 'unsure', label: "I'm not sure" },
            ]} />
            <Q label="Has a doctor ever mentioned concern about your blood sugar / risk of diabetes?" value={diabetesRisk} onChange={setDiabetesRisk} prefix="diabetes" options={[
              { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unsure', label: 'Unsure' },
            ]} />
            <Q label="Do you see a dentist at least twice a year?" value={dentistVisits} onChange={setDentistVisits} prefix="dentist" options={[
              { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' },
            ]} />
            <Q label="When was your last eye exam?" value={eyeExam} onChange={setEyeExam} prefix="eye" options={[
              { value: 'within-5-years', label: 'Within the last 5 years' },
              { value: 'more-than-5', label: 'More than 5 years ago' },
              { value: 'unsure', label: "I'm not sure" },
            ]} />

            {isFemale && age >= 21 && (
              <>
                <Q label="Have you had a Pap test in the last 3 years?" value={papTest} onChange={setPapTest} prefix="pap" options={[
                  { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unsure', label: 'Unsure' },
                ]} />
                <Q label="Has a doctor ever discussed breast cancer screening with you?" value={breastCancerDiscussion} onChange={setBreastCancerDiscussion} prefix="breast" options={[
                  { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' },
                ]} />
              </>
            )}

            <Q label="Have you ever had a one-time screening for Hep C and HIV?" value={hepCHIVScreening} onChange={setHepCHIVScreening} prefix="hep" options={[
              { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unsure', label: 'Unsure' },
            ]} />
            <Q label="Do you regularly check your skin and body for unusual lumps or lesions?" value={selfExams} onChange={setSelfExams} prefix="self" options={[
              { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' },
            ]} />

            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold text-lg mb-4">Financial Protection</h3>
              <div className="space-y-5">
                <Q label="Do you currently have any disability or income-protection insurance?" value={disabilityInsurance} onChange={setDisabilityInsurance} prefix="disability" options={[
                  { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unsure', label: 'Unsure' },
                ]} />
                <Q label="Do you currently have any form of permanent/whole life insurance?" value={lifeInsurance} onChange={setLifeInsurance} prefix="life" options={[
                  { value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unsure', label: 'Unsure' },
                ]} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" size="lg" onClick={() => setCurrentStep(2)} className="flex-1">
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
