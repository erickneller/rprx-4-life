import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Verify admin role
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

    // Parse body
    const { action, userId } = await req.json();
    if (!action || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing action or userId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prevent self-actions
    if (userId === callerUserId) {
      return new Response(
        JSON.stringify({ error: "Cannot perform this action on yourself" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Service role client for admin operations
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (action) {
      case "reset-password": {
        // Get user email first
        const { data: userData, error: userErr } =
          await serviceClient.auth.admin.getUserById(userId);
        if (userErr || !userData?.user?.email) {
          return new Response(
            JSON.stringify({ error: "User not found or has no email" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        // Use the anon client to trigger Supabase's built-in recovery mailer.
        // admin.generateLink only GENERATES a link — it does NOT send mail.
        const origin =
          req.headers.get("origin") ||
          (req.headers.get("referer") || "").replace(/\/+$/, "") ||
          "";
        const redirectTo = origin ? `${origin}/reset-password` : undefined;

        const { error: resetErr } = await anonClient.auth.resetPasswordForEmail(
          userData.user.email,
          redirectTo ? { redirectTo } : undefined
        );
        if (resetErr) {
          const msg = (resetErr as any)?.message || "Failed to send reset email";
          const isRate =
            (resetErr as any)?.status === 429 || /rate limit/i.test(msg);
          return new Response(
            JSON.stringify({
              error: isRate
                ? "Please wait a moment before requesting another reset email for this user."
                : msg,
            }),
            {
              status: isRate ? 429 : 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        return new Response(
          JSON.stringify({
            success: true,
            message: `Password reset email sent to ${userData.user.email}`,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "ban-user": {
        // Toggle ban: check current state
        const { data: userData, error: userErr } =
          await serviceClient.auth.admin.getUserById(userId);
        if (userErr) throw userErr;

        const isBanned =
          userData?.user?.banned_until &&
          new Date(userData.user.banned_until) > new Date();

        const { error: banErr } =
          await serviceClient.auth.admin.updateUserById(userId, {
            ban_duration: isBanned ? "none" : "876000h",
          });
        if (banErr) throw banErr;

        return new Response(
          JSON.stringify({
            success: true,
            banned: !isBanned,
            message: isBanned ? "User unlocked" : "User locked",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "delete-user": {
        const { error: delErr } =
          await serviceClient.auth.admin.deleteUser(userId);
        if (delErr) throw delErr;
        return new Response(
          JSON.stringify({ success: true, message: "User deleted" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (err) {
    console.error("admin-user-actions error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
