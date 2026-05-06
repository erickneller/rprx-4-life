import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAssessmentStore } from '@/store/healthAssessmentStore';
import { ArrowRight, ArrowLeft, Lock } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateHealthScore } from '@/utils/health/scoring';
import { generatePhysicalSnapshot } from '@/utils/health/physicalSnapshot';


const contactSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  email: z.string().trim().email('Please enter a valid email address').max(255),
  phone: z.string().trim().min(10, 'Please enter a valid phone number').max(20),
  consent: z.boolean().refine((val) => val === true, 'You must agree to receive your results'),
});

export function Step5Contact() {
  const { persona, basicProfile, healthHabits, screenings, goals, contact, setContact, setCurrentStep } = useAssessmentStore();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState(contact.firstName || '');
  const [lastName, setLastName] = useState(contact.lastName || '');
  const [email, setEmail] = useState(contact.email || '');
  const [phone, setPhone] = useState(contact.phone || '');
  const [consent, setConsent] = useState(contact.consent || false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setErrors({});
    setIsSubmitting(true);

    try {
      const validatedData = contactSchema.parse({ firstName, lastName, email, phone, consent });
      setContact(validatedData);

      const scores = calculateHealthScore(basicProfile, healthHabits, screenings, goals);

      const heightInMeters = basicProfile.heightFeet && basicProfile.heightInches !== undefined
        ? ((basicProfile.heightFeet * 12 + basicProfile.heightInches) * 0.0254)
        : undefined;
      const bmi = heightInMeters && basicProfile.weight ? basicProfile.weight / Math.pow(heightInMeters, 2) : undefined;

      const screeningGaps: string[] = [];
      if (screenings.bloodPressureCheck === 'never' || screenings.bloodPressureCheck === 'over2years') screeningGaps.push('Blood Pressure');
      if (screenings.cholesterolCheck === 'never' || screenings.cholesterolCheck === 'over5years') screeningGaps.push('Cholesterol');
      if (screenings.hepCHIVScreening === 'no') screeningGaps.push('Hep C/HIV');

      const insuranceGaps: string[] = [];
      if (screenings.disabilityInsurance === 'no') insuranceGaps.push('Disability Insurance');
      if (screenings.lifeInsurance === 'no') insuranceGaps.push('Life Insurance');

      const submissionPayload = {
        name: `${validatedData.firstName} ${validatedData.lastName}`,
        email: validatedData.email,
        phone: validatedData.phone,
        persona: persona!,
        age: basicProfile.age,
        sex: basicProfile.sex,
        bmi: bmi ? Math.round(bmi * 10) / 10 : undefined,
        healthFlags: {
          smoker: healthHabits.smoking === 'yes',
          exerciseFrequency: healthHabits.exerciseDays !== undefined ? String(healthHabits.exerciseDays) : undefined,
          screeningGaps,
          insuranceGaps,
        },
        scores: { current: scores.current, improvement: scores.improvement, readiness: scores.readiness },
        responses: { basicProfile, healthHabits, screenings, goals },
        snapshot: (() => {
          const s = generatePhysicalSnapshot({
            persona: persona ?? null,
            basicProfile,
            healthHabits,
            screenings,
            goals,
            contact: validatedData,
          });
          return {
            primary_horseman: s.primaryHorseman,
            secondary_horseman: s.secondaryHorseman,
            readiness_score: s.readinessScore,
            readiness_label: s.readinessLabel,
            recommended_track: s.recommendedTrack,
            recommended_track_name: s.recommendedTrackName,
            quick_wins: s.quickWins,
          };
        })(),
      };

      const { error } = await supabase.functions.invoke('submit-health-assessment', {
        body: submissionPayload,
      });

      if (error) {
        console.error('Submission error:', error);
        toast({ title: 'Error saving your results', description: "We couldn't save your assessment. Please try again.", variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }

      setCurrentStep(6);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
        toast({ title: 'Please check your information', description: 'Some fields need your attention.', variant: 'destructive' });
      } else {
        toast({ title: 'Something went wrong', description: 'Please try again.', variant: 'destructive' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6 animate-in fade-in duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-3">
            <Lock className="w-8 h-8 text-accent" />
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground">You're Almost Done!</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Enter your information to see your RPRx Health Score and personalized plan</p>
        </div>

        <Card className="p-8 space-y-6 shadow-lg border-border">
          <div className="bg-secondary/50 border border-border rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>Your privacy matters:</strong> We'll only use your information to send you your health assessment results and occasional updates about RPRx. You can unsubscribe anytime.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1.5" required />
              {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input id="lastName" placeholder="Smith" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1.5" required />
              {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input id="email" type="email" placeholder="john.smith@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" required />
            {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="phone">Mobile Phone *</Label>
            <Input id="phone" type="tel" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" required />
            {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
          </div>

          <div className="flex items-start space-x-3 pt-2">
            <Checkbox id="consent" checked={consent} onCheckedChange={(checked) => setConsent(checked as boolean)} />
            <div className="flex-1">
              <Label htmlFor="consent" className="cursor-pointer text-sm leading-relaxed font-normal">
                I agree to receive my results and occasional updates related to RPRx. I understand I can unsubscribe at any time.
              </Label>
              {errors.consent && <p className="text-sm text-destructive mt-1">{errors.consent}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" size="lg" onClick={() => setCurrentStep(4)} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button size="lg" onClick={handleSubmit} disabled={isSubmitting} className="flex-1 bg-gradient-accent hover:opacity-90">
              {isSubmitting ? 'Saving...' : 'See My Results'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
