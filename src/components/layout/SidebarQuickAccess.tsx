'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  TrendingUp,
  Eye,
  History,
  Shield,
  Link as LinkIcon,
  Target,
  Settings,
  Users,
  Building2,
} from 'lucide-react';

const quickAccess = [
  { href: '/executive?tab=forecast', label: 'Forecasting', icon: TrendingUp },
  { href: '/executive?tab=products', label: 'Product Audit', icon: Eye },
  { href: '/executive?tab=back-audit', label: 'Back Audit', icon: History },
  { href: '/control-gate', label: 'Control Gate', icon: Shield },
  { href: '/api-docs', label: 'API Documentation', icon: LinkIcon },
  { href: '/resolver', label: 'AI Resolver', icon: Target },
];

type Props = {
  pathname: string;
  isAdmin: boolean;
  tenantLabel: string;
  navLinkClass: (isActive: boolean) => string;
};

export function SidebarQuickAccess({
  pathname,
  isAdmin,
  tenantLabel,
  navLinkClass,
}: Props) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab');

  return (
    <>
      <div className="px-4 mt-8 mb-2">
        <p className="text-xs font-semibold text-slate-500 tracking-widest">
          QUICK ACCESS
        </p>
      </div>
      {quickAccess.map((item) => {
        const tabParam = item.href.includes('?tab=')
          ? item.href.split('=')[1]
          : null;
        const isActive =
          (pathname === '/executive' && activeTab === tabParam) ||
          pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={navLinkClass(!!isActive)}
          >
            <item.icon size={18} className="shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}

      <Link
        href="/settings"
        className={navLinkClass(pathname.startsWith('/settings'))}
      >
        <Settings size={18} className="shrink-0" />
        <span>Settings</span>
      </Link>

      {isAdmin && (
        <Link
          href="/settings/tenants"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all text-slate-500 hover:bg-slate-100"
          title={`Active workspace: ${tenantLabel}`}
        >
          <Building2 size={18} className="shrink-0" />
          <span className="truncate">{tenantLabel}</span>
        </Link>
      )}

      {isAdmin && (
        <Link
          href="/admin/roles"
          className={navLinkClass(pathname === '/admin/roles')}
        >
          <Users size={18} className="shrink-0" />
          <span>Role Management</span>
        </Link>
      )}
    </>
  );
}

export function SidebarQuickAccessFallback() {
  return (
    <div className="mt-8 space-y-2 px-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}