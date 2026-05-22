// Stripe webhook → upsert user_subscriptions
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Map a Stripe price ID to a tier. Configured via PRICE_TIER_MAP env var
// as JSON: { "price_xxx": "partner", "price_yyy": "pro", ... }
function loadPriceMap(): Record<string, "partner" | "pro"> {
  const raw = Deno.env.get("PRICE_TIER_MAP") || "{}";
  try { return JSON.parse(raw); } catch { return {}; }
}

function intervalFromPrice(price: Stripe.Price | null | undefined): string | null {
  return price?.recurring?.interval ?? null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const whSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !whSecret) {
    return new Response("Stripe not configured", { status: 500 });
  }
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

  const sig = req.headers.get("stripe-signature");
  if (!sig) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, whSecret);
  } catch (err) {
    console.error("Signature verify failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const priceMap = loadPriceMap();

  async function upsertFromSubscription(sub: Stripe.Subscription, fallbackUserId?: string, email?: string) {
    const userId = (sub.metadata?.user_id as string | undefined) || fallbackUserId;
    if (!userId) {
      console.warn("No user_id on subscription", sub.id);
      return;
    }
    const item = sub.items.data[0];
    const priceId = item?.price?.id ?? null;
    const tier = (priceId && priceMap[priceId]) || "free";
    const interval = intervalFromPrice(item?.price);
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;

    const row: Record<string, unknown> = {
      user_id: userId,
      email: email ?? null,
      stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
      stripe_subscription_id: sub.id,
      stripe_price_id: priceId,
      billing_interval: interval,
      status: sub.status,
      current_period_end: periodEnd,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      tier,
      updated_at: new Date().toISOString(),
    };

    // If subscription is no longer paying, drop to free
    if (["canceled", "incomplete_expired", "unpaid"].includes(sub.status)) {
      row.tier = "free";
    }

    const { error } = await admin
      .from("user_subscriptions")
      .upsert(row, { onConflict: "user_id" });
    if (error) console.error("Upsert failed", error);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertFromSubscription(
            sub,
            session.client_reference_id || undefined,
            session.customer_details?.email || undefined,
          );
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertFromSubscription(sub);
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        if (inv.subscription) {
          const subId = typeof inv.subscription === "string" ? inv.subscription : inv.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertFromSubscription(sub);
        }
        break;
      }
      default:
        // ignore
        break;
    }
  } catch (err) {
    console.error("Handler error", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
