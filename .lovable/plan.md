# BYOK Stripe Integration Plan

Build Stripe billing on top of your existing Supabase project (no Lovable Cloud switch). You manage products/prices/promo codes in your own Stripe dashboard; the app reads from Stripe via edge functions and gates features by tier.

## Tiers (final)

- **Free** — $0
- **Partner** — $49.97/mo or $497/yr
- **Pro** — $997/mo or $9,997/yr

Tax automation: **off** (option 3 — you handle taxes yourself).

## What gets built

### 1. Stripe setup (you do this in Stripe dashboard)
- Create 2 Products: `Partner`, `Pro`
- Each product gets 2 recurring Prices (monthly + yearly) — 4 prices total
- Create any promo codes you want (Stripe Dashboard → Coupons → Promotion codes); customers enter them at checkout
- Grab your **Secret Key** (sk_live_… or sk_test_…) and **Webhook Signing Secret** (created in step 3 below)

### 2. Secrets added to Supabase
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### 3. Database (migration)
New table `subscribers`:
- `user_id` (uuid, unique, FK-style to auth.users)
- `email`
- `stripe_customer_id`
- `stripe_subscription_id`
- `tier` — enum-like text: `free` | `partner` | `pro`
- `billing_interval` — `month` | `year` | null
- `status` — `active` | `trialing` | `past_due` | `canceled` | `incomplete`
- `current_period_end` (timestamptz)
- `cancel_at_period_end` (bool)
- timestamps

RLS: users can SELECT their own row; only edge functions (service role) write.

Update `get_subscription_tier()` RPC to read from `subscribers` and return `free` | `partner` | `pro` (currently returns `free`/`paid`).

### 4. Edge functions (3 new)
- **`create-checkout`** — authenticated. Input: `{ priceId }`. Creates/reuses Stripe customer, returns Checkout Session URL. `allow_promotion_codes: true` so customers can enter discount codes.
- **`customer-portal`** — authenticated. Returns Stripe Billing Portal URL so users self-manage subscriptions, payment methods, cancellations.
- **`stripe-webhook`** — public (verifies Stripe signature). Handles `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.payment_failed`. Upserts `subscribers` row, maps Stripe price → tier via a `PRICE_TIER_MAP` env-driven config.

Webhook URL to register in Stripe: `https://wkzgjvnpnhyluxvclymh.supabase.co/functions/v1/stripe-webhook`

### 5. Frontend
- **`useSubscription` hook** — extend to return `tier: 'free' | 'partner' | 'pro'`, `isPartner`, `isPro`, `interval`. Update all existing `isPaid` callers to use new tier (Partner+ = paid).
- **Landing `Pricing.tsx`** — rewrite 3 cards with new tiers, monthly/yearly toggle, "Save with annual" badge. CTA → `create-checkout`.
- **Account/Billing area** — small section on `/profile` (or new `/billing`) showing current tier, renewal date, "Manage Subscription" button → `customer-portal`, and upgrade CTAs.
- **Success/Cancel handling** — checkout returns to `/dashboard?checkout=success|cancelled` with a toast.

### 6. Admin Payments tab (in `/admin`)
Read-only Stripe management surface (no product CRUD in-app — Stripe dashboard is the source of truth, which is the right pattern):
- **Subscribers table**: list `subscribers` rows with tier, status, renewal, link to Stripe customer
- **Quick links**: deep links to Stripe dashboard sections (Products, Coupons, Promotion codes, Customers)
- **Manual override**: admin can set a user's tier (comp accounts) — writes to a `tier_override` column on `subscribers`; `get_subscription_tier()` honors override first

### 7. W2 landing config
Update `src/lib/w2Config.ts` `CHECKOUT_ANNUAL_URL` / `CHECKOUT_MONTHLY_URL` to point at the new Partner annual/monthly Stripe Checkout (via `create-checkout` flow rather than static Payment Links, so promo codes + auth work).

## Out of scope (per your direction)
- No Stripe Tax / tax automation
- No in-app product or coupon creation UI (managed in Stripe dashboard)
- No proration UI beyond what Billing Portal provides

## Order of execution
1. Confirm plan → add 2 secrets
2. DB migration (`subscribers` + updated RPC)
3. Edge functions (checkout, portal, webhook)
4. You create products/prices in Stripe + register webhook → paste price IDs back to me
5. Frontend (hook update, Pricing, billing UI, admin tab)
6. End-to-end test in Stripe test mode

Ready to proceed?
