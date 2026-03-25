import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GHL_API_BASE = "https://services.leadconnectorhq.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const email = user.email as string;

    // Get GHL secrets
    const GHL_API_KEY = Deno.env.get("GHL_API_KEY");
    const GHL_LOCATION_ID = Deno.env.get("GHL_LOCATION_ID");

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      console.error("GHL_API_KEY or GHL_LOCATION_ID not configured");
      return new Response(
        JSON.stringify({ error: "GHL integration not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse the contact fields from the request body
    const { full_name, phone, source } = await req.json();

    // Prevent sync loops — skip if this update came from the GHL webhook
    if (source === "ghl-webhook") {
      return new Response(
        JSON.stringify({ skipped: true, reason: "webhook origin" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Split full_name into first/last for GHL
    const nameParts = (full_name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Upsert contact in GHL
    const ghlResponse = await fetch(`${GHL_API_BASE}/contacts/upsert`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GHL_API_KEY}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      body: JSON.stringify({
        email,
        firstName,
        lastName,
        phone: phone || undefined,
        locationId: GHL_LOCATION_ID,
      }),
    });

    if (!ghlResponse.ok) {
      const errBody = await ghlResponse.text();
      console.error(`GHL upsert failed [${ghlResponse.status}]: ${errBody}`);
      return new Response(
        JSON.stringify({
          error: "GHL sync failed",
          status: ghlResponse.status,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const ghlData = await ghlResponse.json();
    const contactId = ghlData?.contact?.id;

    // Store ghl_contact_id on profile if we got one
    if (contactId) {
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await serviceClient
        .from("profiles")
        .update({ ghl_contact_id: contactId })
        .eq("id", userId);
    }

    return new Response(
      JSON.stringify({ success: true, contactId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ghl-sync error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
