'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/app/providers';
import {
  fetchTenantRow,
  getFallbackTenantMeta,
  isTenantsTableEnabled,
} from '@/lib/settings/tenant';
import { getActiveTenantId } from '@/lib/settings/adminApi';
import { FALLBACK_TENANT_ID } from '@/hooks/useActiveTenant';
import {
  DEFAULT_TENANT_SETTINGS,
  mergeTenantSettings,
  Tenant,
  TenantSettings,
} from '@/lib/settings/types';

function buildFallbackTenant(tenantId: string): Tenant {
  const now = new Date().toISOString();
  return {
    id: tenantId,
    name: 'OEO Solution',
    slug: 'oeo-solution',
    billing_email: 'admin@oeosolution.com',
    timezone: 'Africa/Lagos',
    currency: 'NGN',
    logo_url: null,
    plan: 'professional',
    settings: DEFAULT_TENANT_SETTINGS,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
}

export function useTenantSettings() {
  const { profile, user, refreshRole, loading: authLoading } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantsUnavailable, setTenantsUnavailable] = useState(false);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const tenantId = hydrated
    ? getActiveTenantId(profile?.tenant_id) || profile?.tenant_id || FALLBACK_TENANT_ID
    : profile?.tenant_id || FALLBACK_TENANT_ID;

  const fetchTenant = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError, missing } = await fetchTenantRow(tenantId);

      if (missing || fetchError || !data) {
        const fallback = buildFallbackTenant(tenantId);
        const meta = getFallbackTenantMeta(tenantId);
        setTenant({ ...fallback, name: meta.name, plan: meta.plan });
        setTenantsUnavailable(true);
        if (fetchError && !missing) setError(fetchError.message);
        return;
      }

      setTenantsUnavailable(false);

      setTenant({
        ...data,
        settings: mergeTenantSettings(data.settings as Partial<TenantSettings>),
      });
    } catch (err: unknown) {
      setTenant(buildFallbackTenant(tenantId));
      setError(err instanceof Error ? err.message : 'Failed to load tenant');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (!hydrated || authLoading) return;
    if (user) fetchTenant();
    else setLoading(false);
  }, [hydrated, authLoading, user, fetchTenant]);

  const updateTenant = async (updates: Partial<Tenant>) => {
    if (!tenant) return { error: 'No tenant loaded' };
    if (tenantsUnavailable || !isTenantsTableEnabled()) {
      return {
        error: 'Tenants table not ready. Run supabase/RUN_THIS_IN_SQL_EDITOR.sql in Supabase SQL Editor.',
      };
    }
    setSaving(true);
    setError(null);

    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error: updateError } = await supabase
      .from('tenants')
      .update(payload)
      .eq('id', tenant.id)
      .select()
      .single();

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return { error: updateError.message };
    }

    setTenant({
      ...data,
      settings: mergeTenantSettings(data.settings as Partial<TenantSettings>),
    });
    await refreshRole();
    return { data };
  };

  const updateSettings = async (patch: Partial<TenantSettings>) => {
    if (!tenant) return { error: 'No tenant loaded' };
    const nextSettings = mergeTenantSettings({ ...tenant.settings, ...patch });
    return updateTenant({ settings: nextSettings as unknown as Tenant['settings'] });
  };

  return {
    tenant,
    tenantId,
    loading: loading || authLoading || !hydrated,
    saving,
    error,
    fetchTenant,
    updateTenant,
    updateSettings,
    isAdmin: profile?.role === 'admin',
    tenantsUnavailable,
  };
}