// Stripe Price IDs — fill these in after creating products & prices in your Stripe Dashboard.
// Each tier needs a monthly and a yearly recurring price.
// Override via env at build time: VITE_STRIPE_PRICE_PARTNER_MONTH, etc.

export const STRIPE_PRICES = {
  partner: {
    month: (import.meta.env.VITE_STRIPE_PRICE_PARTNER_MONTH as string) || 'price_1Ta02rEPcfQ6mR62bgmQQV8M',
    year: (import.meta.env.VITE_STRIPE_PRICE_PARTNER_YEAR as string) || 'price_1Ta0DDEPcfQ6mR626ln3KP1e',
  },
  pro: {
    month: (import.meta.env.VITE_STRIPE_PRICE_PRO_MONTH as string) || 'price_1Ta0CpEPcfQ6mR62NOWJrAZr',
    year: (import.meta.env.VITE_STRIPE_PRICE_PRO_YEAR as string) || 'price_1Ta0CpEPcfQ6mR62Vd5p4R2qz',
  },
};
