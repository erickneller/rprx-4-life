// GHL order form URLs — one per plan/interval combo.
// Replace with the live URLs from your GHL funnel/order forms.
// The URL should accept ?email, ?user_id, and ?ref query params for prefill + affiliate tracking.

export type PlanKey = 'partner' | 'pro';
export type IntervalKey = 'month' | 'year';

export const GHL_CHECKOUT_URLS: Record<PlanKey, Record<IntervalKey, string>> = {
  partner: {
    month: 'https://link.rprx4life.com/widget/form/REPLACE_PARTNER_MONTH',
    year:  'https://link.rprx4life.com/widget/form/REPLACE_PARTNER_YEAR',
  },
  pro: {
    month: 'https://link.rprx4life.com/widget/form/REPLACE_PRO_MONTH',
    year:  'https://link.rprx4life.com/widget/form/REPLACE_PRO_YEAR',
  },
};

// Public-facing funnel page for cold (logged-out) traffic. Affiliate ?ref= is appended automatically.
export const GHL_PUBLIC_FUNNEL_URL = 'https://link.rprx4life.com/pricing';

export function buildCheckoutUrl(
  plan: PlanKey,
  interval: IntervalKey,
  opts: { email?: string | null; userId?: string | null; ref?: string | null } = {},
): string {
  const base = GHL_CHECKOUT_URLS[plan][interval];
  const url = new URL(base);
  if (opts.email)  url.searchParams.set('email', opts.email);
  if (opts.userId) url.searchParams.set('user_id', opts.userId);
  if (opts.ref)    url.searchParams.set('ref', opts.ref);
  return url.toString();
}

export function buildPublicFunnelUrl(ref?: string | null): string {
  const url = new URL(GHL_PUBLIC_FUNNEL_URL);
  if (ref) url.searchParams.set('ref', ref);
  return url.toString();
}
