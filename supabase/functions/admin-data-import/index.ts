import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Only config/back-office tables — user data tables are intentionally excluded
const ALLOWED_TABLES = [
  "strategy_definitions",
  "strategy_catalog_v2",
  "prompt_engine_config",
  "assessment_questions",
  "deep_dive_questions",
  "badge_definitions",
  "onboarding_content",
  "prompt_templates",
  "feature_flags",
  "page_help_content",
  "knowledge_base",
  "dashboard_card_config",
  "sidebar_nav_config",
  "activity_xp_config",
  "user_guide_sections",
  "partner_categories",
  "partners",
  "wizard_step_content",
];

// Per-table upsert conflict key. Defaults to "id" when not specified.
const UPSERT_CONFLICT_KEYS: Record<string, string> = {
  strategy_catalog_v2: "strategy_id",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerUserId = claimsData.claims.sub as string;
    const { data: isAdmin } = await anonClient.rpc("has_role", {
      _user_id: callerUserId,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { table, rows, mode } = body as {
      table: string;
      rows: Record<string, unknown>[];
      mode: "upsert" | "replace";
    };

    if (!table || !ALLOWED_TABLES.includes(table)) {
      return new Response(JSON.stringify({ error: `Invalid table: ${table}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ error: "No rows provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (mode !== "upsert" && mode !== "replace") {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Discover real columns by selecting one row, so unknown CSV columns are dropped.
    const { data: sampleRows, error: sampleErr } = await serviceClient
      .from(table)
      .select("*")
      .limit(1);
    if (sampleErr) throw sampleErr;

    let knownColumns: string[] = [];
    if (sampleRows && sampleRows.length > 0) {
      knownColumns = Object.keys(sampleRows[0]);
    } else {
      // Empty table — fall back to using whatever the CSV provides
      knownColumns = Object.keys(rows[0]);
    }

    // Strip unknown columns + drop empty-string id cells
    const cleaned = rows.map((r) => {
      const out: Record<string, unknown> = {};
      for (const k of knownColumns) {
        if (k in r) out[k] = r[k];
      }
      return out;
    });

    if (mode === "replace") {
      const { error: delErr } = await serviceClient
        .from(table)
        .delete()
        .not("id", "is", null);
      if (delErr) throw delErr;

      const { error: insErr } = await serviceClient.from(table).insert(cleaned);
      if (insErr) throw insErr;
    } else {
      // Upsert by primary key `id`
      const { error: upErr } = await serviceClient
        .from(table)
        .upsert(cleaned, { onConflict: "id" });
      if (upErr) throw upErr;
    }

    return new Response(
      JSON.stringify({
        success: true,
        rowsProcessed: cleaned.length,
        mode,
        table,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("admin-data-import error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
