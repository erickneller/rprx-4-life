import { create } from 'zustand';

export type Persona =
  | 'business-owner'
  | 'retiree'
  | 'salesperson'
  | 'wage-earner'
  | 'investor'
  | 'farmer'
  | 'non-profit'
  | 'other';

export interface BasicProfile {
  age: number;
  sex: 'male' | 'female' | 'prefer-not-to-say';
  heightFeet: number;
  heightInches: number;
  weight: number;
  lifestyle: string;
}

export interface HealthHabits {
  overallHealth: number;
  energy: number;
  sleep: number;
  stress: number;
  exerciseDays: number;
  healthyEatingDays: number;
  smoking: string;
  alcohol: string;
}

export interface Screenings {
  bloodPressureCheck: string;
  bloodPressureHigh: string;
  cholesterolCheck: string;
  diabetesRisk: string;
  dentistVisits: string;
  eyeExam: string;
  papTest?: string;
  breastCancerDiscussion?: string;
  hepCHIVScreening: string;
  selfExams: string;
  disabilityInsurance: string;
  lifeInsurance: string;
}

export interface Goals {
  primaryGoal: string;
  timeHorizon: string;
  commitment: number;
  obstacles: string[];
}

export interface Contact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  consent: boolean;
}

interface AssessmentStore {
  persona: Persona | null;
  basicProfile: Partial<BasicProfile>;
  healthHabits: Partial<HealthHabits>;
  screenings: Partial<Screenings>;
  goals: Partial<Goals>;
  contact: Partial<Contact>;
  currentStep: number;
  editingId: string | null;
  viewOnly: boolean;

  setPersona: (persona: Persona) => void;
  setBasicProfile: (data: Partial<BasicProfile>) => void;
  setHealthHabits: (data: Partial<HealthHabits>) => void;
  setScreenings: (data: Partial<Screenings>) => void;
  setGoals: (data: Partial<Goals>) => void;
  setContact: (data: Partial<Contact>) => void;
  setCurrentStep: (step: number) => void;
  hydrateFromRecord: (
    record: {
      id: string;
      persona: Persona | null;
      basic_profile: Partial<BasicProfile>;
      health_habits: Partial<HealthHabits>;
      screenings: Partial<Screenings>;
      goals: Partial<Goals>;
      contact: Partial<Contact>;
    },
    opts: { viewOnly: boolean; startStep: number },
  ) => void;
  reset: () => void;
}

const initialState = {
  persona: null,
  basicProfile: {},
  healthHabits: {},
  screenings: {},
  goals: {},
  contact: {},
  currentStep: 0,
  editingId: null as string | null,
  viewOnly: false,
};

export const useAssessmentStore = create<AssessmentStore>((set) => ({
  ...initialState,
  setPersona: (persona) => set({ persona }),
  setBasicProfile: (data) => set((state) => ({ basicProfile: { ...state.basicProfile, ...data } })),
  setHealthHabits: (data) => set((state) => ({ healthHabits: { ...state.healthHabits, ...data } })),
  setScreenings: (data) => set((state) => ({ screenings: { ...state.screenings, ...data } })),
  setGoals: (data) => set((state) => ({ goals: { ...state.goals, ...data } })),
  setContact: (data) => set((state) => ({ contact: { ...state.contact, ...data } })),
  setCurrentStep: (step) => set({ currentStep: step }),
  hydrateFromRecord: (record, opts) =>
    set({
      editingId: record.id,
      viewOnly: opts.viewOnly,
      persona: record.persona ?? null,
      basicProfile: record.basic_profile ?? {},
      healthHabits: record.health_habits ?? {},
      screenings: record.screenings ?? {},
      goals: record.goals ?? {},
      contact: record.contact ?? {},
      currentStep: opts.startStep,
    }),
  reset: () => set(initialState),
}));
