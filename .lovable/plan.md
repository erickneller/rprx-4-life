# Pivot: GHL-only checkout + affiliate program

No existing subscribers → clean rip-out, no migration of live Stripe subs needed.

## Why

Affiliates only get tracked on orders through GHL. Running Stripe in parallel would create commissionable and non-commissionable revenue in two ledgers. Single funnel = single source of truth for revenue, commissions, refunds.

## End-state architecture

```text
  Cold traffic                      Logged-in Free user clicks Upgrade
       |                                        |
       v                                        v
  GHL funnel page                   In-app modal embeds GHL order form
  (?ref=AFF on link)                (?ref=AFF + email + user_id prefilled)
       |                                        |
       +--------------------+-------------------+
                            v
                  GHL processes payment + affiliate commission
                            |
                            v
                  GHL workflow -> ghl-checkout-webhook
                            |
                            v
                  user_subscriptions -> useSubscription
```

## Scope

### 1. Delete Stripe entirely

- Delete `supabase/functions/create-checkout/`, `stripe-webhook/`, `customer-portal/`
- Delete `src/lib/stripeConfig.ts`
- Remove `VITE_STRIPE_PRICE_*` from `.env`
- Remove Stripe function blocks from `supabase/config.toml`
- Remove Stripe branch from `BillingCard.tsx`
- Delete secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

Migration:
- Drop columns `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id` from `user_subscriptions` (safe — no rows).
- Set `source` default to `'ghl'`.

### 2. In-app upgrade = GHL form in modal

New: `src/components/billing/UpgradeModal.tsx`
- Plan + interval tabs (Partner/Pro × monthly/yearly) → swap iframe `src`.
- Iframe URL = `<GHL_FORM_URL>?email=<user.email>&user_id=<user.id>&ref=<aff>`.
- While open, poll `subscription-tier` query every 3s; on tier change → toast + close.

New config: `src/lib/ghlCheckoutConfig.ts` — 4 GHL order form URLs (you provide).

### 3. Affiliate attribution

New table `affiliate_attributions` (user_id pk, affiliate_id, landing_path, captured_at). RLS: own-read, service-write.

New hook `src/hooks/useAffiliateCapture.ts`:
- On mount, read `?ref=` from URL → store in `localStorage` (90-day TTL).
- On sign-in, upsert to `affiliate_attributions` (first-touch wins).

Pass-through: `UpgradeModal` + logged-out Pricing buttons append `?ref=` to GHL URLs.

Webhook: add optional `affiliate_id` field → store on `user_subscriptions.affiliate_id` (new column) for reconciliation.

### 4. Pricing page — dual mode

`src/components/landing/Pricing.tsx`:
- Logged-out → external link to GHL funnel with `?ref=`.
- Logged-in → opens `UpgradeModal`.
- Remove all `create-checkout` calls.

### 5. BillingCard simplification

Single view: tier badge, period end, "Upgrade / Change plan" → opens `UpgradeModal`, "Manage via support" mailto for paid users. No Stripe portal.

### 6. Webhook update

`ghl-checkout-webhook/index.ts`:
- Parse + persist `affiliate_id`.
- Match user by `email` OR `user_id` (whichever GHL passes through).

## Technical details

Migration SQL:
```sql
alter table user_subscriptions
  drop column if exists stripe_customer_id,
  drop column if exists stripe_subscription_id,
  drop column if exists stripe_price_id,
  add column if not exists affiliate_id text,
  alter column source set default 'ghl';

create table public.affiliate_attributions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  affiliate_id text not null,
  landing_path text,
  captured_at timestamptz not null default now()
);
alter table public.affiliate_attributions enable row level security;
create policy "own read" on public.affiliate_attributions
  for select using (auth.uid() = user_id);
-- writes via service role only
```

GHL postMessage isn't guaranteed → polling fallback is the contract.

## Order of work

1. Migration (drop Stripe cols, add `affiliate_id`, create `affiliate_attributions`).
2. Delete Stripe edge functions + config.toml blocks + frontend code + env vars + secrets.
3. `ghlCheckoutConfig.ts` + `UpgradeModal` (tabs + iframe + polling).
4. `useAffiliateCapture` hook + wire into app root.
5. Rewrite `Pricing.tsx` (logged-out external, logged-in modal).
6. Simplify `BillingCard.tsx` (single view + Upgrade button).
7. Update `ghl-checkout-webhook` (affiliate_id + user_id match).
8. You provide 4 GHL order form URLs + GHL funnel URL → paste into config.
9. End-to-end test: cold traffic `?ref=` → GHL → webhook → tier active + affiliate stored.

## Out of scope (v1)

- In-app affiliate dashboard (GHL has its own).
- Multi-touch attribution (first-touch only).
- Cross-source upgrades (no Stripe to coexist with).
