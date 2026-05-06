import type {
  Persona,
  BasicProfile,
  HealthHabits,
  Screenings,
  Goals,
  Contact,
} from '@/store/healthAssessmentStore';

export type PhysicalHorseman = 'energy' | 'strength' | 'mobility' | 'prevention';

export type RecommendedTrack =
  | 'foundation-reset'
  | 'fat-loss-foundation'
  | 'strength-and-muscle-base'
  | 'mobility-and-joint-resilience'
  | 'owner-health-optimization'
  | 'retirement-health-preservation'
  | 'performance-and-confidence-reset'
  | 'recovery-and-resilience-track';

export interface PhysicalSnapshot {
  primaryHorseman: PhysicalHorseman;
  secondaryHorseman: PhysicalHorseman;
  horsemanScores: Record<PhysicalHorseman, number>;
  readinessScore: number;
  readinessLabel: string;
  recommendedTrack: RecommendedTrack;
  recommendedTrackName: string;
  recommendedTrackDescription: string;
  whatThisMeans: string;
  whyThisMatters: string;
  quickWins: string[];
  weeklyFocus: { week: string; goal: string }[];
}

export interface SnapshotInput {
  persona: Persona | null;
  basicProfile: Partial<BasicProfile>;
  healthHabits: Partial<HealthHabits>;
  screenings: Partial<Screenings>;
  goals: Partial<Goals>;
  contact: Partial<Contact>;
}

export const HORSEMAN_LABELS: Record<PhysicalHorseman, string> = {
  energy: 'Energy Loss',
  strength: 'Strength Loss',
  mobility: 'Mobility Loss',
  prevention: 'Prevention Gaps',
};

export const TRACK_NAMES: Record<RecommendedTrack, string> = {
  'foundation-reset': 'Foundation Reset',
  'fat-loss-foundation': 'Fat Loss Foundation',
  'strength-and-muscle-base': 'Strength and Muscle Base',
  'mobility-and-joint-resilience': 'Mobility and Joint Resilience',
  'owner-health-optimization': 'Owner Health Optimization',
  'retirement-health-preservation': 'Retirement Health Preservation',
  'performance-and-confidence-reset': 'Performance and Confidence Reset',
  'recovery-and-resilience-track': 'Recovery and Resilience Track',
};

const TRACK_DESCRIPTIONS: Record<RecommendedTrack, string> = {
  'foundation-reset':
    'A simple starting plan focused on walking, hydration, sleep rhythm, basic mobility, and small repeatable wins.',
  'fat-loss-foundation':
    'A practical plan focused on movement consistency, simple nutrition habits, strength support, and sustainable fat-loss behaviors.',
  'strength-and-muscle-base':
    'A strength-centered plan focused on building muscle, structure, confidence, and long-term physical capacity.',
  'mobility-and-joint-resilience':
    'A movement-centered plan focused on mobility, flexibility, joint comfort, balance, and safe progression.',
  'owner-health-optimization':
    'A business-owner-focused plan designed to support energy, recovery, strength, and physical capacity in a demanding schedule.',
  'retirement-health-preservation':
    'A healthy-aging plan focused on strength, balance, mobility, independence, prevention, and enjoying the life you worked to build.',
  'performance-and-confidence-reset':
    'A professional-performance plan focused on energy, appearance, consistency, confidence, and practical routines that fit a busy life.',
  'recovery-and-resilience-track':
    'A recovery-first plan focused on sleep, stress, hydration, low-friction movement, and rebuilding daily energy.',
};

const WHAT_THIS_MEANS: Record<PhysicalHorseman, string> = {
  energy:
    'Your answers suggest your first opportunity may be improving energy, recovery, sleep rhythm, stress management, hydration, and daily consistency. This does not mean anything is medically wrong. It simply means your body may be asking for a better recovery and energy system.',
  strength:
    'Your answers suggest your first opportunity may be rebuilding strength, muscle, structure, and consistency. Strength is not just about the gym. It supports metabolism, posture, confidence, aging, and physical independence.',
  mobility:
    'Your answers suggest your first opportunity may be improving mobility, joint comfort, flexibility, balance, and movement confidence. The goal is to move better, reduce friction, and build a body that feels safer and more capable.',
  prevention:
    'Your answers suggest your first opportunity may be improving your preventive wellness rhythm. This may include tracking basic health markers, staying current with screenings, and building a more consistent follow-up routine with qualified healthcare professionals.',
};

const WHY_THIS_MATTERS: Record<string, string> = {
  'business-owner':
    'As a business owner, your energy, focus, and physical capacity affect how you lead, make decisions, serve clients, and enjoy the business you are building.',
  retiree:
    'In retirement or pre-retirement, strength, mobility, energy, and prevention help protect independence and quality of life.',
  salesperson:
    'In a performance-driven career, energy, confidence, appearance, and consistency affect how you show up every day.',
  'wage-earner':
    'With real work and life demands, a simple wellness rhythm can help you feel more in control of your energy and habits.',
  investor:
    'You may already think strategically about financial returns. This result points to the physical capacity needed to enjoy those returns.',
  farmer:
    'When your body is part of your livelihood, durability, recovery, mobility, and strength matter.',
  'non-profit':
    'When your work is built around serving others, your energy and resilience are not optional. They are part of your ability to keep serving well.',
  default:
    'Your physical wellness affects your energy, confidence, independence, and future freedom.',
};

function readinessLabel(score: number): string {
  if (score < 40) return 'Foundation Needed';
  if (score < 60) return 'Reset Recommended';
  if (score < 80) return 'Momentum Builder';
  return 'Optimization Ready';
}

function isLowExercise(days?: number) {
  return typeof days === 'number' && days <= 1;
}

function isSedentary(lifestyle?: string) {
  return lifestyle === 'sedentary' || lifestyle === 'lightly-active';
}

function hasPainObstacle(obstacles?: string[]) {
  return !!obstacles?.includes('pain');
}

function isPreventionMissing(s: Partial<Screenings>): number {
  let gaps = 0;
  if (!s.bloodPressureCheck || s.bloodPressureCheck === 'unsure' || s.bloodPressureCheck === 'more-than-3') gaps++;
  if (!s.cholesterolCheck || s.cholesterolCheck === 'unsure' || s.cholesterolCheck === 'more-than-5') gaps++;
  if (!s.diabetesRisk || s.diabetesRisk === 'unsure') gaps++;
  if (s.dentistVisits !== 'yes') gaps++;
  if (!s.eyeExam || s.eyeExam === 'unsure' || s.eyeExam === 'more-than-5') gaps++;
  return gaps;
}

function scoreHorsemen(input: SnapshotInput): Record<PhysicalHorseman, number> {
  const { basicProfile, healthHabits, screenings, goals } = input;
  const scores: Record<PhysicalHorseman, number> = { energy: 0, strength: 0, mobility: 0, prevention: 0 };

  // Energy
  if ((healthHabits.sleep ?? 5) <= 2) scores.energy += 2;
  if ((healthHabits.stress ?? 0) >= 4) scores.energy += 2;
  if ((healthHabits.energy ?? 5) <= 2) scores.energy += 2;
  if (healthHabits.alcohol === '3-5x-week' || healthHabits.alcohol === 'almost-daily') scores.energy += 1;
  if (healthHabits.smoking === 'yes') scores.energy += 1;
  const obs = goals.obstacles ?? [];
  if (obs.includes('time') || obs.includes('motivation')) scores.energy += 1;

  // Strength
  if (isLowExercise(healthHabits.exerciseDays)) scores.strength += 2;
  if (isSedentary(basicProfile.lifestyle)) scores.strength += 1;
  if ((basicProfile.age ?? 0) >= 45) scores.strength += 1;
  const strengthGoals = ['weight-loss', 'muscle-gain', 'strength', 'bodybuilding', 'longevity', 'energy'];
  if (goals.primaryGoal && strengthGoals.includes(goals.primaryGoal)) scores.strength += 1;

  // Mobility
  if (hasPainObstacle(goals.obstacles)) scores.mobility += 3;
  const mobilityGoals = ['mobility', 'injury-recovery', 'injury-prevention'];
  if (goals.primaryGoal && mobilityGoals.includes(goals.primaryGoal)) scores.mobility += 2;
  if ((basicProfile.age ?? 0) >= 50) scores.mobility += 1;
  if (isSedentary(basicProfile.lifestyle)) scores.mobility += 1;

  // Prevention
  const gaps = isPreventionMissing(screenings);
  scores.prevention += gaps;
  if ((basicProfile.age ?? 0) >= 45) scores.prevention += 1;
  if ((basicProfile.age ?? 0) >= 55 && gaps >= 2) scores.prevention += 2;

  return scores;
}

function pickPrimarySecondary(
  scores: Record<PhysicalHorseman, number>,
  input: SnapshotInput,
): { primary: PhysicalHorseman; secondary: PhysicalHorseman } {
  const ordered = (Object.entries(scores) as [PhysicalHorseman, number][])
    .sort((a, b) => b[1] - a[1]);

  let primary = ordered[0][0];
  // Tie-breakers
  if (hasPainObstacle(input.goals.obstacles)) primary = 'mobility';
  else if ((input.basicProfile.age ?? 0) >= 55 && isPreventionMissing(input.screenings) >= 2) primary = 'prevention';
  else if (ordered[0][1] === ordered[1][1] && (ordered[0][0] === 'energy' || ordered[1][0] === 'energy')) primary = 'energy';
  else if (isLowExercise(input.healthHabits.exerciseDays) && (input.basicProfile.age ?? 0) >= 45 && ordered[0][1] === ordered[1][1]) primary = 'strength';

  const secondary =
    (ordered.find(([h]) => h !== primary) as [PhysicalHorseman, number])[0];
  return { primary, secondary };
}

function calculateReadiness(input: SnapshotInput): number {
  const { healthHabits, basicProfile, goals, screenings } = input;
  let score = 50;
  if ((healthHabits.exerciseDays ?? 0) >= 2) score += 8;
  if ((healthHabits.exerciseDays ?? 0) >= 4) score += 4;
  if ((healthHabits.healthyEatingDays ?? 0) >= 5) score += 6;
  if ((healthHabits.sleep ?? 0) >= 4) score += 6;
  if ((healthHabits.energy ?? 0) >= 4) score += 4;
  if ((healthHabits.stress ?? 5) <= 2) score += 4;
  if (healthHabits.alcohol === 'never' || healthHabits.alcohol === 'rarely') score += 3;
  if ((goals.commitment ?? 0) >= 4) score += 6;
  if (goals.timeHorizon && goals.timeHorizon.length > 5) score += 3;

  if (isSedentary(basicProfile.lifestyle)) score -= 6;
  if (isLowExercise(healthHabits.exerciseDays)) score -= 8;
  if ((healthHabits.sleep ?? 5) <= 2) score -= 6;
  if ((healthHabits.stress ?? 0) >= 4) score -= 5;
  if ((healthHabits.energy ?? 5) <= 2) score -= 5;
  if (healthHabits.smoking === 'yes') score -= 5;
  const gaps = isPreventionMissing(screenings);
  if (gaps >= 3) score -= 6;
  else if (gaps >= 2) score -= 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function pickTrack(input: SnapshotInput, primary: PhysicalHorseman): RecommendedTrack {
  const { persona, basicProfile, healthHabits, goals } = input;
  const age = basicProfile.age ?? 0;
  const goal = goals.primaryGoal;
  const stressHigh = (healthHabits.stress ?? 0) >= 4;
  const energyLow = (healthHabits.energy ?? 5) <= 2;
  const sleepPoor = (healthHabits.sleep ?? 5) <= 2;

  if (primary === 'mobility' || hasPainObstacle(goals.obstacles)) return 'mobility-and-joint-resilience';
  if (persona === 'business-owner' && (primary === 'energy' || primary === 'strength' || stressHigh)) return 'owner-health-optimization';
  if (persona === 'retiree' || age >= 60) return 'retirement-health-preservation';
  if (
    (persona === 'salesperson' || persona === 'wage-earner' || persona === 'investor') &&
    (goal === 'weight-loss' || goal === 'energy' || goal === 'muscle-gain' || goal === 'strength')
  ) return 'performance-and-confidence-reset';
  if (sleepPoor && stressHigh && energyLow) return 'recovery-and-resilience-track';
  if (goal === 'weight-loss') return 'fat-loss-foundation';
  if (goal === 'strength' || goal === 'muscle-gain' || goal === 'bodybuilding') return 'strength-and-muscle-base';
  return 'foundation-reset';
}

function buildQuickWins(input: SnapshotInput, primary: PhysicalHorseman): string[] {
  const wins: string[] = [];
  const { healthHabits, screenings, goals } = input;

  // Primary horseman win
  if (primary === 'energy') {
    wins.push('Set a consistent bedtime and wake time at least 5 nights this week.');
  } else if (primary === 'strength') {
    wins.push('Complete 2 beginner strength sessions this week (20–30 minutes each).');
  } else if (primary === 'mobility') {
    wins.push('Add a 5-minute mobility routine for hips, back, or shoulders, 4 days this week.');
  } else {
    const missing: string[] = [];
    if (screenings.bloodPressureCheck !== 'within-year') missing.push('blood pressure');
    if (screenings.cholesterolCheck !== 'within-5-years') missing.push('cholesterol');
    if (screenings.dentistVisits !== 'yes') missing.push('dental');
    const target = missing[0] ?? 'preventive care';
    wins.push(`Schedule or confirm a ${target} follow-up with a qualified provider this month.`);
  }

  // Hydration / nutrition win
  if ((healthHabits.healthyEatingDays ?? 0) <= 4) {
    wins.push('Add protein to the first meal of the day, at least 5 days this week.');
  } else {
    wins.push('Drink 16–24 ounces of water before lunch each day.');
  }

  // Movement win
  if ((healthHabits.exerciseDays ?? 0) <= 2) {
    wins.push('Walk 10–20 minutes after one meal per day.');
  } else if (goals.obstacles?.includes('time')) {
    wins.push('Take a 2-minute movement break every 90 minutes during work hours.');
  } else {
    wins.push('Use walking phone calls when possible to add daily movement.');
  }

  return wins.slice(0, 3);
}

function buildWeeklyFocus(primary: PhysicalHorseman): { week: string; goal: string }[] {
  const flavor: Record<PhysicalHorseman, string[]> = {
    energy: [
      'Stabilize sleep and hydration — pick one bedtime and stick to it.',
      'Add two short walks and one stress-reduction habit (breathing, stretch, or quiet time).',
      'Track energy daily and address your biggest energy drain.',
      'Review what worked, choose your next 90-day track, and book your advisor call.',
    ],
    strength: [
      'Choose two short strength sessions and a simple protein habit.',
      'Add a third movement day and one nutrition upgrade.',
      'Increase load or reps slightly and track consistency.',
      'Decide your next 90-day track and book your advisor call.',
    ],
    mobility: [
      'Pick one daily 5-minute mobility flow and walk lightly each day.',
      'Add a second mobility window and one pain-aware strength move.',
      'Progress range of motion gradually and track what feels better.',
      'Pick your next track and book a call to plan safe progression.',
    ],
    prevention: [
      'Schedule one missing follow-up and start a simple tracking habit.',
      'Add one nutrition or movement habit you can sustain.',
      'Confirm appointments and review numbers with a qualified provider.',
      'Lock in your wellness rhythm and book your advisor call.',
    ],
  };
  const labels = ['Week 1: Stabilize', 'Week 2: Build', 'Week 3: Progress', 'Week 4: Lock In'];
  return labels.map((week, i) => ({ week, goal: flavor[primary][i] }));
}

export function generatePhysicalSnapshot(input: SnapshotInput): PhysicalSnapshot {
  const horsemanScores = scoreHorsemen(input);
  const { primary, secondary } = pickPrimarySecondary(horsemanScores, input);
  const readinessScore = calculateReadiness(input);
  const recommendedTrack = pickTrack(input, primary);
  const personaKey = input.persona ?? 'default';

  return {
    primaryHorseman: primary,
    secondaryHorseman: secondary,
    horsemanScores,
    readinessScore,
    readinessLabel: readinessLabel(readinessScore),
    recommendedTrack,
    recommendedTrackName: TRACK_NAMES[recommendedTrack],
    recommendedTrackDescription: TRACK_DESCRIPTIONS[recommendedTrack],
    whatThisMeans: WHAT_THIS_MEANS[primary],
    whyThisMatters: WHY_THIS_MATTERS[personaKey] ?? WHY_THIS_MATTERS.default,
    quickWins: buildQuickWins(input, primary),
    weeklyFocus: buildWeeklyFocus(primary),
  };
}
