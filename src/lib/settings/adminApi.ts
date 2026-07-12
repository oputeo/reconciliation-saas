import { supabase } from '@/lib/supabase';

const ACTIVE_TENANT_KEY = 'reconflow_active_tenant_id';

export function getActiveTenantId(fallback?: string | null) {
  if (typeof window === 'undefined') return fallback ?? null;
  return sessionStorage.getItem(ACTIVE_TENANT_KEY) || fallback || null;
}

export function setActiveTenantId(tenantId: string) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(ACTIVE_TENANT_KEY, tenantId);
  }
}

export async function callAdminApi(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('You must be signed in');

  const activeTenantId = getActiveTenantId();
  const payload = activeTenantId ? { ...body, tenant_id: body.tenant_id ?? activeTenantId } : body;

  const { data, error } = await supabase.functions.invoke('admin-users', {
    body: payload,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    const ctx = error as { context?: Response; message?: string };
    if (ctx.context) {
      try {
        const json = await ctx.context.json();
        throw new Error(json?.error || json?.message || error.message);
      } catch {
        throw new Error(error.message);
      }
    }
    throw new Error(error.message);
  }

  if (data?.error) throw new Error(data.error);
  if (data?.success === false) throw new Error(data.message || 'Request failed');
  return data;
}