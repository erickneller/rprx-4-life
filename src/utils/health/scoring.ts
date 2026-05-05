import { BasicProfile, HealthHabits, Screenings, Goals } from '@/store/healthAssessmentStore';

export interface HealthScore {
  current: number;
  improvement: number;
  readiness: 'great' | 'high' | 'critical';
}

export function calculateBMI(heightFeet: number, heightInches: number, weight: number): number {
  const totalInches = (heightFeet * 12) + heightInches;
  return (weight / (totalInches * totalInches)) * 703;
}

export function calculateHealthScore(
  basicProfile: Partial<BasicProfile>,
  healthHabits: Partial<HealthHabits>,
  screenings: Partial<Screenings>,
  goals: Partial<Goals>
): HealthScore {
  let currentScore = 0;
  let improvementScore = 0;

  if (healthHabits.exerciseDays) currentScore += Math.min((healthHabits.exerciseDays / 7) * 15, 15);
  if (healthHabits.healthyEatingDays) currentScore += Math.min((healthHabits.healthyEatingDays / 7) * 10, 10);
  if (healthHabits.sleep) currentScore += (healthHabits.sleep / 5) * 8;
  if (healthHabits.stress) currentScore += ((6 - healthHabits.stress) / 5) * 7;

  if (healthHabits.smoking === 'never') currentScore += 10;
  else if (healthHabits.smoking === 'used-to') currentScore += 5;

  if (healthHabits.alcohol === 'never' || healthHabits.alcohol === 'rarely') currentScore += 10;
  else if (healthHabits.alcohol === '1-2x-week') currentScore += 7;
  else if (healthHabits.alcohol === '3-5x-week') currentScore += 3;

  let screeningScore = 0;
  if (screenings.bloodPressureCheck === 'within-year') screeningScore += 5;
  else if (screenings.bloodPressureCheck === '1-3-years') screeningScore += 3;
  if (screenings.cholesterolCheck === 'within-5-years') screeningScore += 5;
  if (screenings.diabetesRisk === 'no') screeningScore += 3;
  if (screenings.dentistVisits === 'yes') screeningScore += 4;
  if (screenings.eyeExam === 'within-5-years') screeningScore += 3;
  if (screenings.selfExams === 'yes') screeningScore += 3;
  if (screenings.hepCHIVScreening === 'yes') screeningScore += 2;
  currentScore += screeningScore;

  if (basicProfile.heightFeet && basicProfile.heightInches !== undefined && basicProfile.weight) {
    const bmi = calculateBMI(basicProfile.heightFeet, basicProfile.heightInches, basicProfile.weight);
    if (bmi >= 18.5 && bmi < 25) currentScore += 15;
    else if (bmi >= 25 && bmi < 30) currentScore += 10;
    else if (bmi >= 30 && bmi < 35) currentScore += 5;
  }

  if (healthHabits.exerciseDays !== undefined && healthHabits.exerciseDays < 3) improvementScore += 4;
  if (healthHabits.healthyEatingDays !== undefined && healthHabits.healthyEatingDays < 4) improvementScore += 3;
  if (healthHabits.sleep !== undefined && healthHabits.sleep < 3) improvementScore += 3;

  if (screenings.bloodPressureCheck !== 'within-year') improvementScore += 2;
  if (screenings.cholesterolCheck !== 'within-5-years') improvementScore += 2;
  if (screenings.dentistVisits !== 'yes') improvementScore += 2;
  if (screenings.eyeExam !== 'within-5-years') improvementScore += 2;
  if (screenings.selfExams !== 'yes') improvementScore += 2;

  if (screenings.disabilityInsurance !== 'yes') improvementScore += 3;
  if (screenings.lifeInsurance !== 'yes') improvementScore += 2;

  if (goals.commitment && goals.commitment >= 4) improvementScore += 5;
  else if (goals.commitment && goals.commitment >= 3) improvementScore += 3;

  let readiness: 'great' | 'high' | 'critical';
  if (currentScore >= 75 && improvementScore <= 10) readiness = 'great';
  else if (currentScore >= 50 && improvementScore <= 20) readiness = 'high';
  else readiness = 'critical';

  return {
    current: Math.round(currentScore),
    improvement: Math.round(improvementScore),
    readiness,
  };
}
