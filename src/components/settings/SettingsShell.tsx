'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Building2,
  Bell,
  CreditCard,
  GitBranch,
  LayoutGrid,
  Plug,
  Clock,
  Shield,
  Sliders,
  Users,
  Layers,
} from 'lucide-react';
import TenantSwitcher from '@/components/settings/TenantSwitcher';
import { useAuth } from '@/app/providers';
import {
  canAccessSettingsSection,
  ROLE_LABELS,
  normalizeRole,
  SettingsSection,
} from '@/lib/settings/permissions';
import { Badge } from '@/components/ui/badge';
import { useTenantSettings } from '@/hooks/useTenantSettings';

const NAV: { href: string; label: string; icon: React.ElementType; section: SettingsSection }[] = [
  { href: '/settings', label: 'Overview', icon: LayoutGrid, section: 'overview' },
  { href: '/settings/organization', label: 'Organization', icon: Building2, section: 'organization' },
  { href: '/settings/tenants', label: 'Workspaces', icon: Layers, section: 'tenants' },
  { href: '/settings/users', label: 'Users & Teams', icon: Users, section: 'users' },
  { href: '/settings/reconciliation', label: 'Reconciliation', icon: GitBranch, section: 'reconciliation' },
  { href: '/settings/fees', label: 'Fee Engine', icon: CreditCard, section: 'fees' },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell, section: 'notifications' },
  { href: '/settings/integrations', label: 'Integrations', icon: Plug, section: 'integrations' },
  { href: '/settings/ingest', label: 'Ingest & Automation', icon: Clock, section: 'ingest' },
  { href: '/settings/security', label: 'Security', icon: Shield, section: 'security' },
];

export default function SettingsShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const { tenant, loading: tenantLoading } = useTenantSettings();
  const role = normalizeRole(profile?.role);

  useEffect(() => {
    if (authLoading) return;
    const section = NAV.find((n) =>
      n.href === '/settings' ? pathname === '/settings' : pathname.startsWith(n.href),
    );
    if (section && !canAccessSettingsSection(section.section, role)) {
      router.replace('/access-denied');
    }
  }, [pathname, role, authLoading, router]);

  const visibleNav = NAV.filter((item) => canAccessSettingsSection(item.section, role));

  return (
    <div className="settings-shell space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-emerald-600 flex items-center justify-center">
              <Sliders className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-700">Workspace Settings</p>
              <p className="text-xs text-slate-500">
                {tenantLoading ? 'Loading tenant…' : tenant?.name || 'Organization'}
              </p>
            </div>
            <Badge variant="secondary" className="ml-1 capitalize">
              {ROLE_LABELS[role] || role}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          {description && <p className="text-slate-600 mt-1 max-w-2xl">{description}</p>}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <TenantSwitcher />
          {actions}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 shrink-0">
          <nav className="settings-nav space-y-1">
            {visibleNav.map((item) => {
              const isActive =
                item.href === '/settings'
                  ? pathname === '/settings'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`settings-nav-item ${isActive ? 'settings-nav-item-active' : ''}`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 space-y-6">{children}</div>
      </div>
    </div>
  );
}