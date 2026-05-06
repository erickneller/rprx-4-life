import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function isString(v: unknown, max = 255): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.length <= max;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const {
    name, email, phone, persona, age, sex, bmi, healthFlags, scores,
    responses,
  } = payload ?? {};

  // Validate required fields
  if (!isString(name, 200)) return json(400, { error: "Invalid name" });
  if (!isString(email, 255) || !/^\S+@\S+\.\S+$/.test(email)) return json(400, { error: "Invalid email" });
  if (!isString(phone, 20) || phone.replace(/\D/g, "").length < 10) return json(400, { error: "Invalid phone" });
  if (!isString(persona, 50)) return json(400, { error: "Invalid persona" });
  if (!scores || typeof scores !== "object") return json(400, { error: "Invalid scores" });
  const current = Number(scores.current);
  const improvement = Number(scores.improvement);
  if (!Number.isFinite(current) || !Number.isFinite(improvement)) {
    return json(400, { error: "Invalid score values" });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    null;

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error: insertError } = await serviceClient
    .from("assessment_submissions")
    .insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      personas: [persona],
      responses: responses ?? {},
      scores: { current, improvement },
      opportunity_index: improvement,
      tier: scores.readiness ?? null,
      submitter_ip: ip,
    } as any);

  if (insertError) {
    console.error("submit-health-assessment insert error:", insertError);
    return json(500, { error: "Failed to save submission" });
  }

  // Forward to GHL via existing function (best-effort)
  try {
    const ghlPayload = { name, email, phone, persona, age, sex, bmi, healthFlags, scores };
    const { error: ghlError } = await serviceClient.functions.invoke("send-to-ghl", {
      body: ghlPayload,
    });
    if (ghlError) console.error("send-to-ghl forward error:", ghlError);
  } catch (e) {
    console.error("GHL forward exception:", e);
  }

  return json(200, { success: true });
});
