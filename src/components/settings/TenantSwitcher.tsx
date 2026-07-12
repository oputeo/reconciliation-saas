'use client';

import { useEffect, useState } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/app/providers';
import { callAdminApi, getActiveTenantId, setActiveTenantId } from '@/lib/settings/adminApi';

interface TenantOption {
  id: string;
  name: string;
  role: string;
}

export default function TenantSwitcher({ onSwitch }: { onSwitch?: () => void }) {
  const { profile } = useAuth();
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await callAdminApi({ action: 'list_my_tenants' });
        const list: TenantOption[] = data.tenants || [];
        setTenants(list);
        const current = getActiveTenantId(profile?.tenant_id) || list[0]?.id || '';
        setActiveId(current);
        if (current) setActiveTenantId(current);
      } catch {
        if (profile?.tenant_id) {
          setTenants([{
            id: profile.tenant_id,
            name: profile.tenant_name || 'Workspace',
            role: profile.role,
          }]);
          setActiveId(profile.tenant_id);
        }
      }
    };
    load();
  }, [profile?.tenant_id, profile?.tenant_name, profile?.role]);

  if (tenants.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-emerald-600" />
      <Select
        value={activeId}
        onValueChange={(id) => {
          setActiveTenantId(id);
          setActiveId(id);
          onSwitch?.();
          window.location.reload();
        }}
      >
        <SelectTrigger className="w-[220px] h-9">
          <SelectValue placeholder="Select workspace" />
        </SelectTrigger>
        <SelectContent>
          {tenants.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name} ({t.role})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <ChevronDown className="h-4 w-4 text-slate-400 -ml-6 pointer-events-none hidden sm:block" />
    </div>
  );
}