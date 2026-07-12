import { supabase } from '@/lib/supabase';

const FALLBACK_TENANTS: Record<string, { name: string; plan: string }> = {
  '0771c1a1-4ff0-46a1-9f98-c6b30fdff049': {
    name: 'OEO Solution',
    plan: 'professional',
  },
};

const STORAGE_KEY = 'reconflow_tenants_table_ok';

let tenantsTableOk: boolean | null = null;

function readCachedStatus(): boolean | null {
  if (typeof window === 'undefined') return null;
  const v = sessionStorage.getItem(STORAGE_KEY);
  if (v === 'ok') return true;
  if (v === 'missing') return false;
  return null;
}

function cacheStatus(ok: boolean) {
  tenantsTableOk = ok;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEY, ok ? 'ok' : 'missing');
  }
}

export function isTenantsTableEnabled() {
  if (tenantsTableOk !== null) return tenantsTableOk;
  const cached = readCachedStatus();
  if (cached !== null) {
    tenantsTableOk = cached;
    return cached;
  }
  return true; // optimistic first check
}

export function resetTenantsTableCache() {
  tenantsTableOk = null;
  if (typeof window !== 'undefined') sessionStorage.removeItem(STORAGE_KEY);
}

export function getFallbackTenantMeta(tenantId: string) {
  return (
    FALLBACK_TENANTS[tenantId] ?? {
      name: 'Workspace',
      plan: 'professional',
    }
  );
}

/** Safe tenant fetch — skips network call if table known missing */
export async function fetchTenantMeta(tenantId: string) {
  const cached = readCachedStatus();
  if (cached === false) return getFallbackTenantMeta(tenantId);

  const { data, error } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .maybeSingle();

  if (error) {
    cacheStatus(false);
    return getFallbackTenantMeta(tenantId);
  }

  cacheStatus(true);
  const fallback = getFallbackTenantMeta(tenantId);
  return {
    name: data?.name ?? fallback.name,
    plan: fallback.plan,
  };
}

export async function fetchTenantRow(tenantId: string) {
  const cached = readCachedStatus();
  if (cached === false) {
    return { data: null, error: null, missing: true };
  }

  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .maybeSingle();

  if (error) {
    cacheStatus(false);
    return { data: null, error, missing: true };
  }

  cacheStatus(true);
  return { data, error: null, missing: false };
}