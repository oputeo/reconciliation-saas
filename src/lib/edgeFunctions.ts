import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getActiveTenantId, setActiveTenantId } from '@/lib/settings/adminApi';

type InvokeResult<T> = { data: T | null; error: Error | null };

function isNetworkError(message?: string): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('connection')
  );
}

function authErrorMessage(cause?: string): string {
  if (isNetworkError(cause)) {
    return 'Network error reaching Supabase. Check your internet connection and try again.';
  }
  return cause || 'You must be signed in';
}

/** Prefer cached session (no network). Refresh only when the local session is missing. */
async function getInvokeAuthContext(): Promise<
  { user: User; accessToken: string } | { error: Error }
> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    return { error: new Error(authErrorMessage(sessionError.message)) };
  }

  if (session?.user?.id && session.access_token) {
    return { user: session.user, accessToken: session.access_token };
  }

  const { data: { session: refreshed }, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    return { error: new Error(authErrorMessage(refreshError.message)) };
  }
  if (!refreshed?.user?.id || !refreshed.access_token) {
    return { error: new Error('You must be signed in') };
  }

  return { user: refreshed.user, accessToken: refreshed.access_token };
}

/** Resolve a tenant_id the signed-in user is allowed to access. */
export async function resolveTenantIdForUser(
  userId: string,
  preferred?: string | null,
): Promise<string | null> {
  const candidate =
    preferred ||
    getActiveTenantId() ||
    null;

  if (candidate) {
    const { data: match } = await supabase
      .from('user_roles')
      .select('tenant_id')
      .eq('user_id', userId)
      .eq('tenant_id', candidate)
      .maybeSingle();

    if (match?.tenant_id) return match.tenant_id;
  }

  const { data: fallback } = await supabase
    .from('user_roles')
    .select('tenant_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fallback?.tenant_id) {
    setActiveTenantId(fallback.tenant_id);
    return fallback.tenant_id;
  }

  return null;
}

export async function invokeTenantFunction<T = Record<string, unknown>>(
  functionName: string,
  body: Record<string, unknown>,
  tenantId?: string | null,
): Promise<InvokeResult<T>> {
  const auth = await getInvokeAuthContext();
  if ('error' in auth) {
    return { data: null, error: auth.error };
  }
  const { user, accessToken } = auth;

  const resolvedTenantId = await resolveTenantIdForUser(
    user.id,
    (body.tenant_id as string | undefined) || tenantId,
  );

  if (!resolvedTenantId) {
    return {
      data: null,
      error: new Error('No workspace access. Ask an admin to assign your account to a tenant.'),
    };
  }

  const payload = { ...body, tenant_id: resolvedTenantId };

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (error) {
    const parsed = await parseInvokeError(error);
    return { data: null, error: new Error(authErrorMessage(parsed.message)) };
  }

  const record = data as { success?: boolean; error?: string } | null;
  if (record?.success === false && record.error) {
    return { data: null, error: new Error(record.error) };
  }

  return { data: data as T, error: null };
}

async function parseInvokeError(error: {
  context?: Response;
  message?: string;
}): Promise<Error> {
  if (error.context) {
    try {
      const json = await error.context.json();
      return new Error(json?.error || json?.message || error.message);
    } catch {
      return new Error(error.message ?? 'Request failed');
    }
  }
  return new Error(error.message ?? 'Request failed');
}

/** Multipart upload invoke (FormData) with tenant resolution and JWT auth. */
export async function invokeUploadFunction<T = Record<string, unknown>>(
  functionName: string,
  formData: FormData,
  tenantId?: string | null,
): Promise<InvokeResult<T>> {
  const auth = await getInvokeAuthContext();
  if ('error' in auth) {
    return { data: null, error: auth.error };
  }
  const { user, accessToken } = auth;

  const formTenant = String(formData.get('tenant_id') || '').trim() || null;
  const resolvedTenantId = await resolveTenantIdForUser(
    user.id,
    formTenant || tenantId,
  );

  if (!resolvedTenantId) {
    return {
      data: null,
      error: new Error('No workspace access. Ask an admin to assign your account to a tenant.'),
    };
  }

  formData.set('tenant_id', resolvedTenantId);

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: formData,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (error) {
    const parsed = await parseInvokeError(error);
    return { data: null, error: new Error(authErrorMessage(parsed.message)) };
  }

  const record = data as { success?: boolean; error?: string } | null;
  if (record?.success === false && record.error) {
    return { data: null, error: new Error(record.error) };
  }

  return { data: data as T, error: null };
}