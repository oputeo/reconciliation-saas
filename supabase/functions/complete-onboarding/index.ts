import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user?.email) return json({ error: "Unauthorized" }, 401);

    const email = user.email.toLowerCase();

    const { data: request } = await supabase
      .from("access_requests")
      .select("id, tenant_id, role")
      .eq("email", email)
      .eq("status", "pending")
      .not("tenant_id", "is", null)
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!request) {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("tenant_id, role")
        .eq("user_id", user.id)
        .maybeSingle();

      return json({
        success: true,
        onboarded: Boolean(existingRole),
        message: existingRole ? "Already onboarded" : "No pending invite",
        role: existingRole?.role ?? null,
      });
    }

    const { error: roleError } = await supabase.from("user_roles").upsert(
      { user_id: user.id, tenant_id: request.tenant_id, role: request.role },
      { onConflict: "user_id,tenant_id" },
    );

    if (roleError) return json({ error: roleError.message }, 400);

    await supabase
      .from("access_requests")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", request.id);

    return json({
      success: true,
      onboarded: true,
      tenant_id: request.tenant_id,
      role: request.role,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return json({ error: message }, 500);
  }
});