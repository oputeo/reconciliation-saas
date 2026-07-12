import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";

const ROLE_RANK: Record<string, number> = {
  viewer: 1,
  auditor: 2,
  approver: 3,
  admin: 4,
};

export function createServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
}

export function unauthorized(message = "Unauthorized"): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function forbidden(message = "Forbidden"): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function requireAuth(req: Request): Promise<
  { user: { id: string; email?: string }; supabase: SupabaseClient } | Response
> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return unauthorized();

  const supabase = createServiceClient();
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return unauthorized();

  return { user: { id: user.id, email: user.email }, supabase };
}

export async function requireTenantMembership(
  supabase: SupabaseClient,
  userId: string,
  tenantId: string,
  minRole: "viewer" | "auditor" | "approver" | "admin" = "viewer",
): Promise<{ role: string } | null> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error || !data?.role) return null;

  const current = ROLE_RANK[data.role] ?? 0;
  const needed = ROLE_RANK[minRole] ?? 99;
  if (current < needed) return null;

  return { role: data.role };
}

/** Internal edge-to-edge calls (scheduler, cron) using the service role key. */
export function isServiceRoleRequest(req: Request): boolean {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  return Boolean(serviceKey && authHeader === `Bearer ${serviceKey}`);
}

export async function requireServiceOrTenantAccess(
  req: Request,
  tenantId: string,
  minRole: "viewer" | "auditor" | "approver" | "admin" = "viewer",
): Promise<
  | {
    user: { id: string; email?: string } | null;
    supabase: SupabaseClient;
    role: string;
    isService: boolean;
  }
  | Response
> {
  if (!tenantId) {
    return new Response(JSON.stringify({ success: false, error: "tenant_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (isServiceRoleRequest(req)) {
    return {
      user: null,
      supabase: createServiceClient(),
      role: "admin",
      isService: true,
    };
  }

  const access = await requireTenantAccess(req, tenantId, minRole);
  if (access instanceof Response) return access;
  return { ...access, isService: false };
}

export async function requireTenantAccess(
  req: Request,
  tenantId: string,
  minRole: "viewer" | "auditor" | "approver" | "admin" = "viewer",
): Promise<
  { user: { id: string; email?: string }; supabase: SupabaseClient; role: string } | Response
> {
  if (!tenantId) {
    return new Response(JSON.stringify({ success: false, error: "tenant_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;

  const membership = await requireTenantMembership(
    auth.supabase,
    auth.user.id,
    tenantId,
    minRole,
  );
  if (!membership) return forbidden("You do not have access to this workspace");

  return { ...auth, role: membership.role };
}

export async function logAudit(
  supabase: SupabaseClient,
  entry: {
    tenant_id: string;
    user_id: string;
    action: string;
    resource_type?: string;
    resource_id?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await supabase.from("audit_log").insert({
      tenant_id: entry.tenant_id,
      user_id: entry.user_id,
      action: entry.action,
      resource_type: entry.resource_type ?? null,
      resource_id: entry.resource_id ?? null,
      metadata: entry.metadata ?? {},
    });
  } catch {
    // audit log is best-effort
  }
}