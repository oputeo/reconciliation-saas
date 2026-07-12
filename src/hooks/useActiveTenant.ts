'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/app/providers';
import { getActiveTenantId, setActiveTenantId } from '@/lib/settings/adminApi';
import { resolveTenantIdForUser } from '@/lib/edgeFunctions';

export const FALLBACK_TENANT_ID = '0771c1a1-4ff0-46a1-9f98-c6b30fdff049';

/**
 * Returns the active workspace tenant_id validated against user_roles.
 */
export function useActiveTenant() {
  const { profile, user, loading } = useAuth();
  const [validatedTenantId, setValidatedTenantId] = useState<string | null>(null);
  const [validating, setValidating] = useState(true);

  const profileTenant = profile?.tenant_id ?? null;

  useEffect(() => {
    let cancelled = false;

    const syncTenant = async () => {
      if (!user?.id) {
        if (!cancelled) {
          setValidatedTenantId(null);
          setValidating(false);
        }
        return;
      }

      setValidating(true);
      const resolved = await resolveTenantIdForUser(
        user.id,
        profileTenant || getActiveTenantId(),
      );

      if (!cancelled) {
        setValidatedTenantId(resolved);
        setValidating(false);
      }
    };

    if (!loading) syncTenant();

    return () => {
      cancelled = true;
    };
  }, [user?.id, profileTenant, loading]);

  // Avoid reading sessionStorage during render — prevents React hydration mismatch (#418).
  const [storedTenantId, setStoredTenantId] = useState<string | null>(null);
  useEffect(() => {
    setStoredTenantId(getActiveTenantId());
  }, []);

  const tenantId = useMemo(() => {
    return validatedTenantId || profileTenant || storedTenantId || FALLBACK_TENANT_ID;
  }, [validatedTenantId, profileTenant, storedTenantId]);

  useEffect(() => {
    if (validatedTenantId) setActiveTenantId(validatedTenantId);
  }, [validatedTenantId]);

  return {
    tenantId,
    tenantName: profile?.tenant_name ?? null,
    loading: loading || validating,
    isReady: !loading && !validating && !!validatedTenantId,
  };
}