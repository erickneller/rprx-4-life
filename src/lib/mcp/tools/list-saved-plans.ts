import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_saved_plans",
  title: "List my saved strategy plans",
  description:
    "List the signed-in user's saved RPRx strategy plans. The current focus plan is marked with is_focus=true.",
  inputSchema: {
    focus_only: z.boolean().optional().describe("If true, return only the current focus plan."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ focus_only }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let query = supabaseForUser(ctx)
      .from("saved_plans")
      .select("*")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false });
    if (focus_only) query = query.eq("is_focus", true);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { plans: data ?? [] },
    };
  },
});
