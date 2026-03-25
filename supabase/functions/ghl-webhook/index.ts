import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook secret (passed as query param or header)
    const GHL_WEBHOOK_SECRET = Deno.env.get("GHL_WEBHOOK_SECRET");
    if (!GHL_WEBHOOK_SECRET) {
      console.error("GHL_WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check secret in query param or x-webhook-secret header
    const url = new URL(req.url);
    const secretParam = url.searchParams.get("secret");
    const secretHeader = req.headers.get("x-webhook-secret");

    if (secretParam !== GHL_WEBHOOK_SECRET && secretHeader !== GHL_WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: "Invalid webhook secret" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();

    // GHL sends various event types; we only care about contact updates
    const contactId = payload?.id || payload?.contact?.id || payload?.contactId;
    if (!contactId) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "No contact ID in payload" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firstName = payload?.firstName || payload?.contact?.firstName || "";
    const lastName = payload?.lastName || payload?.contact?.lastName || "";
    const phone = payload?.phone || payload?.contact?.phone || null;

    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

    // Use service role to update the profile (no user auth on webhooks)
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up user by ghl_contact_id
    const { data: profile, error: lookupError } = await serviceClient
      .from("profiles")
      .select("id, full_name, phone")
      .eq("ghl_contact_id", contactId)
      .maybeSingle();

    if (lookupError) {
      console.error("Profile lookup error:", lookupError);
      return new Response(
        JSON.stringify({ error: "Lookup failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!profile) {
      // No matching user — ignore
      return new Response(
        JSON.stringify({ skipped: true, reason: "No matching profile" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build update payload, only update fields that changed
    const updates: Record<string, string | null> = {};
    if (fullName && fullName !== profile.full_name) {
      updates.full_name = fullName;
    }
    if (phone !== undefined && phone !== profile.phone) {
      updates.phone = phone;
    }

    if (Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "No changes detected" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: updateError } = await serviceClient
      .from("profiles")
      .update(updates)
      .eq("id", profile.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Update failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`GHL webhook: updated profile ${profile.id} with`, updates);

    return new Response(
      JSON.stringify({ success: true, updated: Object.keys(updates) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ghl-webhook error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
