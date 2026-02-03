import type { Tables, Enums } from "@/integrations/supabase/types";

// Database types
export type DebtJourney = Tables<"debt_journeys">;
export type UserDebt = Tables<"user_debts">;
export type DebtPayment = Tables<"debt_payments">;
export type Badge = Tables<"badges">;
export type UserBadge = Tables<"user_badges">;

// Enums
export type DebtType = Enums<"debt_type">;
export type JourneyStatus = Enums<"journey_status">;
export type PaymentType = Enums<"payment_type">;

// Debt type display labels
export const DEBT_TYPE_LABELS: Record<DebtType, string> = {
  credit_card: "Credit Card",
  student_loan: "Student Loan",
  auto_loan: "Auto Loan",
  mortgage: "Mortgage",
  personal_loan: "Personal Loan",
  medical: "Medical",
  other: "Other",
};

// Debt type icons (lucide icon names)
export const DEBT_TYPE_ICONS: Record<DebtType, string> = {
  credit_card: "credit-card",
  student_loan: "graduation-cap",
  auto_loan: "car",
  mortgage: "home",
  personal_loan: "banknote",
  medical: "stethoscope",
  other: "circle-dot",
};

// Setup wizard state
export interface DebtEntryFormData {
  debt_type: DebtType;
  name: string;
  original_balance: number;
  current_balance: number;
  interest_rate: number;
  min_payment: number;
}

export interface SetupWizardData {
  selectedDebtTypes: DebtType[];
  debts: DebtEntryFormData[];
  dreamText: string;
  dreamImageUrl?: string;
}

// Initial empty debt form
export const createEmptyDebtEntry = (type: DebtType = "credit_card"): DebtEntryFormData => ({
  debt_type: type,
  name: "",
  original_balance: 0,
  current_balance: 0,
  interest_rate: 0,
  min_payment: 0,
});

// Calculate progress percentage
export const calculateProgressPercent = (debts: UserDebt[]): number => {
  if (debts.length === 0) return 0;
  
  const totalOriginal = debts.reduce((sum, d) => sum + d.original_balance, 0);
  const totalCurrent = debts.reduce((sum, d) => sum + d.current_balance, 0);
  
  if (totalOriginal === 0) return 0;
  return Math.round(((totalOriginal - totalCurrent) / totalOriginal) * 100);
};

// Calculate total paid
export const calculateTotalPaid = (debts: UserDebt[]): number => {
  return debts.reduce((sum, d) => sum + (d.original_balance - d.current_balance), 0);
};

// Calculate total remaining
export const calculateTotalRemaining = (debts: UserDebt[]): number => {
  return debts.reduce((sum, d) => sum + d.current_balance, 0);
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
