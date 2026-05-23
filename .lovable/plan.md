## Goal

Two checkout paths into the same `user_subscriptions` row shape so `useSubscription` and gating stay unchanged:

1. **In-app upgrade** → Stripe Checkout (already built).
2. **External landing pages** → GHL order forms → GHL webhook → Supabase edge function → `user_subscriptions`.

## Decisions locked in

- GHL recurring billing is supported → treat GHL subs like Stripe subs (tier + period end).
- New buyers without an account → email them a one-click "claim your account" magic link.
- Cancellation → drop to `free` immediately (no grace period).
- Refund → drop to `free` immediately, same path as cancellation.

## Architecture

```text
              IN-APP PATH                       EXTERNAL PATH
              (logged-in users)                 (cold traffic / LPs)

              Pricing page                      Webflow / WP / LP
                    |                                  |
                    v                                  v
              create-checkout                    GHL order form
              (Stripe)                           (recurring product)
                    |                                  |
                    v                                  v
              Stripe Checkout                    GHL processes payment
                    |                                  |
                    v                                  v
              stripe-webhook                     GHL workflow -> webhook
                    |                                  |
                    +-------------+   +----------------+
                                  |   |
                                  v   v
                        user_subscriptions (Supabase)
                                  |
                                  v
                        get_subscription_tier RPC -> useSubscription
```

## What we build

### 1. Migration — extend `user_subscriptions`, add 2 tables

`user_subscriptions` new columns:
- `source` text not null default `'stripe'` — `'stripe'` | `'ghl'`
- `ghl_contact_id` text
- `ghl_subscription_id` text
- `ghl_product_id` text
- Unique index on `ghl_subscription_id` where not null

New table `pending_ghl_subscriptions`:
- `email` text pk (lowercased)
- `tier` text, `billing_interval` text
- `ghl_contact_id`, `ghl_subscription_id`, `ghl_product_id`
- `current_period_end` timestamptz
- `claim_token` uuid default gen_random_uuid()
- `claimed_at` timestamptz
- `created_at` timestamptz

RLS: service role only (function writes; client never reads).

New table `ghl_product_tier_map` (admin-editable):
- `ghl_product_id` text pk
- `tier` text (`partner` | `pro`)
- `billing_interval` text (`month` | `year`)
- `is_active` boolean

RLS: admins manage, authenticated read.

### 2. Edge function — `ghl-checkout-webhook` (new)

Public POST endpoint. GHL workflows hit it on order success, subscription updated, cancelled, refunded.

- Verify shared secret via `X-Webhook-Secret` header against `GHL_CHECKOUT_WEBHOOK_SECRET`.
- Parse: `email`, `contact_id`, `subscription_id`, `product_id`, `status`, `current_period_end`, `event_type`.
- Map `product_id` → tier via `ghl_product_tier_map` (fallback to hardcoded map if row missing).
- Resolve user:
  - email matches `auth.users` → upsert `user_subscriptions` with `source='ghl'`, `tier=<mapped>`, `status='active'`.
  - no match → upsert `pending_ghl_subscriptions` and call `claim-account-email` (see #3).
- Cancellation / refund / failed events → set tier `free`, status `canceled`. Same logic for matched user or pending row (delete pending).
- Idempotent on `ghl_subscription_id`.

### 3. Edge function — `send-claim-account-email` (new)

Called by `ghl-checkout-webhook` when buyer has no account.
- Generates Supabase magic link for that email (using service-role admin API) with redirect `https://app.rprx4life.com/auth/callback?claim=<token>`.
- Sends branded email via existing transactional infrastructure: "You just upgraded to <Tier>. Click here to activate your account."
- Token = `pending_ghl_subscriptions.claim_token`.

### 4. Auth callback — claim pending subscription

In `AuthCallback.tsx` (and/or right after `onAuthStateChange` SIGNED_IN):
- After session is established, if `?claim=<token>` is present OR always-check by email:
  - Call new edge function `claim-ghl-subscription` (or RPC) that:
    - Looks up `pending_ghl_subscriptions` by email = `auth.user.email`.
    - If found, copies row into `user_subscriptions` (`source='ghl'`, `user_id=auth.uid()`), marks `claimed_at`, deletes pending row.
- Idempotent — safe to call on every sign-in.

### 5. Frontend touches

- `BillingCard.tsx`: when `source === 'ghl'`, hide Stripe "Manage Subscription" button. Show "Manage subscription via your purchase confirmation email" + link to `mailto:support@rprx4life.com`. (GHL has no equivalent of Stripe Customer Portal.)
- `useSubscription`: no change — reads tier via RPC which already abstracts source.
- Pricing page: unchanged. External LPs link to GHL forms directly.

### 6. Admin panel — `ghl_product_tier_map` editor

Small table editor under `/admin` Payments tab so non-devs can wire new GHL products to tiers without a deploy.

### 7. GHL configuration (you do this in GHL)

For each plan (Partner monthly/yearly, Pro monthly/yearly):
1. Create recurring product + price in GHL Payments.
2. Build one order form per plan (or one form with plan selector).
3. Workflows:
   - **Order completed (paid)** → POST to `ghl-checkout-webhook` with `event_type: 'subscription.active'`, email, contact_id, subscription_id, product_id, current_period_end, and `X-Webhook-Secret`.
   - **Subscription renewed** → same webhook with `subscription.renewed` (updates `current_period_end`).
   - **Subscription cancelled / failed** → `subscription.canceled`.
   - **Order refunded** → `subscription.refunded`.

I will give you the exact webhook URL, secret header name, and JSON body schema to paste into each GHL workflow.

## Order of work

1. Migration (new columns + 2 tables + RLS).
2. Add secret `GHL_CHECKOUT_WEBHOOK_SECRET`.
3. Edge function: `ghl-checkout-webhook` (with hardcoded product map fallback so we can test before admin UI exists).
4. Edge function: `send-claim-account-email` (uses existing transactional email infra).
5. Claim logic in auth callback + edge function `claim-ghl-subscription`.
6. `BillingCard` source-aware branching.
7. Admin Payments tab: `ghl_product_tier_map` editor.
8. You configure 1 GHL product + workflow → end-to-end test with a test card.
9. Roll out remaining 3 products.

## Out of scope (v1)

- Reconciliation cron against GHL API (add later if drift shows up).
- Proration/upgrades between GHL plans (cancel-and-rebuy via GHL is fine for now).
- Cross-source upgrades (Stripe customer buying via GHL or vice versa) — we'll just take the most recent active row.