// Stripe Price IDs — fill these in after creating products & prices in your Stripe Dashboard.
// Each tier needs a monthly and a yearly recurring price.
// You can also override via env at build time: VITE_STRIPE_PRICE_PARTNER_MONTH, etc.

export const STRIPE_PRICES = {
  partner: {
    month: (import.meta.env.VITE_STRIPE_PRICE_PARTNER_MONTH as string) || '',
    year: (import.meta.env.VITE_STRIPE_PRICE_PARTNER_YEAR as string) || '',
  },
  pro: {
    month: (import.meta.env.VITE_STRIPE_PRICE_PRO_MONTH as string) || '',
    year: (import.meta.env.VITE_STRIPE_PRICE_PRO_YEAR as string) || '',
  },
};
