import { supabase } from '@/integrations/supabase/client';
import { calculateHealthScore } from '@/utils/health/scoring';
import { generatePhysicalSnapshot } from '@/utils/health/physicalSnapshot';
import type { Persona, BasicProfile, HealthHabits, Screenings, Goals, Contact } from '@/store/healthAssessmentStore';

export interface SubmitArgs {
  persona: Persona | null;
  basicProfile: Partial<BasicProfile>;
  healthHabits: Partial<HealthHabits>;
  screenings: Partial<Screenings>;
  goals: Partial<Goals>;
  contact: Contact;
}

export async function submitHealthAssessment(args: SubmitArgs) {
  const { persona, basicProfile, healthHabits, screenings, goals, contact } = args;

  const scores = calculateHealthScore(basicProfile, healthHabits, screenings, goals);

  const heightInMeters =
    basicProfile.heightFeet !== undefined && basicProfile.heightInches !== undefined
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

  const snapshot = generatePhysicalSnapshot({
    persona: persona ?? null,
    basicProfile,
    healthHabits,
    screenings,
    goals,
    contact,
  });

  const submissionPayload = {
    name: `${contact.firstName} ${contact.lastName}`.trim(),
    email: contact.email,
    phone: contact.phone,
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
    snapshot: {
      primary_horseman: snapshot.primaryHorseman,
      secondary_horseman: snapshot.secondaryHorseman,
      readiness_score: snapshot.readinessScore,
      readiness_label: snapshot.readinessLabel,
      recommended_track: snapshot.recommendedTrack,
      recommended_track_name: snapshot.recommendedTrackName,
      quick_wins: snapshot.quickWins,
    },
  };

  return await supabase.functions.invoke('submit-health-assessment', { body: submissionPayload });
}
