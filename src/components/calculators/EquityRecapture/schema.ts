// Equity Recapture Calculator — Input validation
import { z } from 'zod';

export const equityRecaptureSchema = z.object({
  loanAmount: z
    .number({ invalid_type_error: 'Loan amount is required' })
    .positive('Loan amount must be greater than zero')
    .max(50_000_000, 'Loan amount seems unrealistic'),
  annualInterestRate: z
    .number({ invalid_type_error: 'Interest rate is required' })
    .min(0, 'Rate cannot be negative')
    .max(0.25, 'Rate cannot exceed 25%'),
  termMonths: z
    .number({ invalid_type_error: 'Term is required' })
    .int('Term must be a whole number of months')
    .min(12, 'Minimum 12 months')
    .max(480, 'Maximum 40 years'),
  extraMonthlyPayment: z
    .number()
    .min(0, 'Cannot be negative')
    .default(0),
  extraAnnualPayment: z
    .number()
    .min(0, 'Cannot be negative')
    .default(0),
  annualPaymentMonth: z
    .number()
    .int()
    .min(1, 'Must be 1-12')
    .max(12, 'Must be 1-12')
    .default(1),
});

export type EquityRecaptureFormValues = z.infer<typeof equityRecaptureSchema>;

export const DEFAULT_INPUTS: EquityRecaptureFormValues = {
  loanAmount: 400000,
  annualInterestRate: 0.065,
  termMonths: 360,
  extraMonthlyPayment: 500,
  extraAnnualPayment: 0,
  annualPaymentMonth: 1,
};
