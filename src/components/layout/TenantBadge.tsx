'use client';

import { Building2 } from 'lucide-react';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import { useAuth } from '@/app/providers';

/** Compact tenant indicator for data pages */
export default function TenantBadge() {
  const { tenantId } = useActiveTenant();
  const { profile } = useAuth();
  const name = profile?.tenant_name || 'Workspace';

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
      <Building2 className="h-3.5 w-3.5" />
      <span>{name}</span>
      <span className="text-emerald-500 font-mono hidden sm:inline">
        {tenantId.slice(0, 8)}…
      </span>
    </div>
  );
}