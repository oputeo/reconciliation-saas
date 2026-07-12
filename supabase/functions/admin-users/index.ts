import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = Deno.env.get("SITE_URL") || "http://localhost:3000";
const VALID_ROLES = ["admin", "viewer", "auditor", "approver"] as const;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function signupUrl(email: string) {
  return `${SITE_URL}/accept-invite?email=${encodeURIComponent(email)}`;
}

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function getAdminTenants(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("tenant_id, role")
    .eq("user_id", userId)
    .eq("role", "admin");

  if (error) throw error;
  return data ?? [];
}

async function resolveAdminTenant(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  requestedTenantId?: string,
) {
  const adminTenants = await getAdminTenants(supabase, userId);
  if (!adminTenants.length) return null;

  if (requestedTenantId) {
    const match = adminTenants.find((t) => t.tenant_id === requestedTenantId);
    return match ? requestedTenantId : null;
  }

  return adminTenants[0].tenant_id;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authError } =
      await supabase.auth.getUser(token);

    if (authError || !caller) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const action = String(body.action || "");
    const email = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "viewer").trim().toLowerCase();
    const requestedTenantId = body.tenant_id
      ? String(body.tenant_id)
      : undefined;

    // ── LIST MY TENANTS (any user) ──────────────────────────
    if (action === "list_my_tenants") {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("tenant_id, role")
        .eq("user_id", caller.id);

      if (error) return jsonResponse({ error: error.message }, 400);

      const tenantIds = [...new Set((roles ?? []).map((r) => r.tenant_id))];
      const { data: tenants } = tenantIds.length
        ? await supabase.from("tenants").select("id, name, plan").in("id", tenantIds)
        : { data: [] };

      const tenantMap = new Map((tenants ?? []).map((t) => [t.id, t]));

      return jsonResponse({
        success: true,
        tenants: (roles ?? []).map((r) => ({
          id: r.tenant_id,
          name: tenantMap.get(r.tenant_id)?.name || "Workspace",
          plan: tenantMap.get(r.tenant_id)?.plan || "professional",
          role: r.role,
        })),
      });
    }

    // ── CREATE TENANT (admin in any workspace) ────────────────
    if (action === "create_tenant") {
      const adminTenants = await getAdminTenants(supabase, caller.id);
      if (!adminTenants.length) {
        return jsonResponse({ error: "Admin access required" }, 403);
      }

      const name = String(body.name || "").trim();
      if (!name) return jsonResponse({ error: "Organization name is required" }, 400);

      const slug = slugify(String(body.slug || name));
      const billingEmail = String(body.billing_email || caller.email || "").trim();
      const timezone = String(body.timezone || "Africa/Lagos");
      const currency = String(body.currency || "NGN");

      const { data: newTenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name,
          slug,
          billing_email: billingEmail || null,
          timezone,
          currency,
          plan: "professional",
          settings: {},
        })
        .select()
        .single();

      if (tenantError) return jsonResponse({ error: tenantError.message }, 400);

      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: caller.id,
        tenant_id: newTenant.id,
        role: "admin",
      });

      if (roleError) return jsonResponse({ error: roleError.message }, 400);

      return jsonResponse({
        success: true,
        message: `Workspace "${name}" created`,
        tenant: newTenant,
      });
    }

    // Admin-scoped actions below require tenant context
    const tenantId = await resolveAdminTenant(supabase, caller.id, requestedTenantId);
    if (!tenantId) {
      return jsonResponse({ error: "Admin access required for this workspace" }, 403);
    }

    if (action === "list_pending") {
      const { data, error } = await supabase
        .from("access_requests")
        .select("id, full_name, email, phone, role, status, requested_at, invited_by, tenant_id")
        .eq("tenant_id", tenantId)
        .eq("status", "pending")
        .order("requested_at", { ascending: false });

      if (error) return jsonResponse({ error: error.message }, 400);

      return jsonResponse({
        success: true,
        tenant_id: tenantId,
        requests: (data ?? []).map((row) => ({
          ...row,
          signup_url: signupUrl(row.email),
        })),
      });
    }

    if (action === "list_team") {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role, created_at")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (rolesError) return jsonResponse({ error: rolesError.message }, 400);

      const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const userMap = new Map(
        (authData?.users ?? []).map((u) => [u.id, u]),
      );

      const team = (roles ?? []).map((r) => {
        const authUser = userMap.get(r.user_id);
        return {
          user_id: r.user_id,
          role: r.role,
          created_at: r.created_at,
          email: authUser?.email ?? null,
          full_name: authUser?.user_metadata?.full_name ?? null,
        };
      });

      return jsonResponse({ success: true, tenant_id: tenantId, team });
    }

    if (action === "update_member_role") {
      const targetUserId = String(body.user_id || "");
      if (!targetUserId) return jsonResponse({ error: "user_id is required" }, 400);
      if (!VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
        return jsonResponse({ error: `Invalid role: ${role}` }, 400);
      }
      if (targetUserId === caller.id && role !== "admin") {
        return jsonResponse({ error: "You cannot remove your own admin access" }, 400);
      }

      const { error } = await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", targetUserId)
        .eq("tenant_id", tenantId);

      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ success: true, message: "Role updated" });
    }

    if (action === "invite") {
      if (!email) return jsonResponse({ error: "Valid email is required" }, 400);
      if (!VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
        return jsonResponse({ error: `Invalid role: ${role}` }, 400);
      }

      const displayName = String(body.full_name || email.split("@")[0] || "New User");

      const { data: existing } = await supabase
        .from("access_requests")
        .select("id")
        .eq("email", email)
        .eq("tenant_id", tenantId)
        .eq("status", "pending")
        .maybeSingle();

      const payload = {
        full_name: displayName,
        email,
        phone: body.phone ?? null,
        status: "pending",
        role,
        tenant_id: tenantId,
        invited_by: caller.id,
        requested_at: new Date().toISOString(),
      };

      const { error: saveError } = existing
        ? await supabase.from("access_requests").update(payload).eq("id", existing.id)
        : await supabase.from("access_requests").insert(payload);

      if (saveError) return jsonResponse({ error: saveError.message }, 400);

      return jsonResponse({
        success: true,
        message: `Invite recorded for ${email}`,
        email,
        role,
        tenant_id: tenantId,
        signup_url: signupUrl(email),
        resent: Boolean(existing),
      });
    }

    if (action === "cancel") {
      const requestId = String(body.request_id || "");
      if (!requestId) return jsonResponse({ error: "request_id is required" }, 400);

      const { error } = await supabase
        .from("access_requests")
        .update({ status: "cancelled" })
        .eq("id", requestId)
        .eq("tenant_id", tenantId)
        .eq("status", "pending");

      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ success: true, message: "Invite cancelled" });
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});