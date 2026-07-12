'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  RefreshCw,
  AlertTriangle,
  FileBarChart,
  TrendingUp,
  Shield,
  Upload,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Eye,
  History,
  Link as LinkIcon,
  Users,
  Target,
  Settings,
  Building2,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/app/providers';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import { useUIStore } from '@/store/uiStore';

const mainNav = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/executive', label: 'Executive Intelligence', icon: BarChart3 },
  { href: '/reconciliation', label: 'Live Reconciliation', icon: RefreshCw },
  { href: '/anomalies', label: 'Anomalies & Alerts', icon: AlertTriangle },
  { href: '/uploads', label: 'Bulk Uploads', icon: Upload },
  { href: '/reports', label: 'Reports & Exports', icon: FileBarChart },
];

const quickAccess = [
  { href: '/executive?tab=forecast', label: 'Forecasting', icon: TrendingUp },
  { href: '/executive?tab=products', label: 'Product Audit', icon: Eye },
  { href: '/executive?tab=back-audit', label: 'Back Audit', icon: History },
  { href: '/control-gate', label: 'Control Gate', icon: Shield },
  { href: '/api-docs', label: 'API Documentation', icon: LinkIcon },
  { href: '/resolver', label: 'AI Resolver', icon: Target },
];

function useSidebarState() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { profile, signOut, hasPermission, loading } = useAuth();
  const { tenantName } = useActiveTenant();

  const isAdmin = !loading && hasPermission('admin');
  const activeTab = searchParams.get('tab');

  const currentUser = {
    name: !loading
      ? profile?.full_name || profile?.email?.split('@')[0] || 'User'
      : 'User',
    role: !loading ? profile?.role || 'viewer' : 'viewer',
    tenant: !loading ? tenantName || profile?.tenant_name || 'Workspace' : 'Workspace',
    avatar: !loading ? profile?.avatar_url || '' : '',
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return {
    collapsed,
    toggleSidebar,
    pathname,
    activeTab,
    isAdmin,
    currentUser,
    handleLogout,
  };
}

/** Desktop nav body — rendered inside AppShell grid column (in document flow). */
export function SidebarNav() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <SidebarNavFallback />;
  }

  return <SidebarNavContent />;
}

function SidebarNavContent() {
  const {
    collapsed,
    toggleSidebar,
    pathname,
    activeTab,
    isAdmin,
    currentUser,
    handleLogout,
  } = useSidebarState();

  const navLinkClass = (isActive: boolean) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
      isActive
        ? 'bg-emerald-600 text-white shadow-sm'
        : 'text-slate-700 hover:bg-slate-100'
    }`;

  return (
    <>
      <div className="h-20 px-4 border-b flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-emerald-600 flex items-center justify-center shadow">
            <span className="text-white font-bold text-2xl">R</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-xl tracking-tight truncate">ReconFlow</h1>
              <p className="text-xs text-emerald-600 -mt-1">Revenue Assurance</p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-6 space-y-1">
        {mainNav.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={navLinkClass(isActive)}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {!collapsed && (
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
                title={`Active workspace: ${currentUser.tenant}`}
              >
                <Building2 size={18} className="shrink-0" />
                <span className="truncate">{currentUser.tenant}</span>
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
        )}
      </nav>

      <Separator />

      <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-auto p-3 rounded-xl hover:bg-white"
          onClick={handleLogout}
        >
          <Avatar className="h-10 w-10 border border-slate-200 shrink-0">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback className="bg-emerald-100 text-emerald-700 font-medium">
              {currentUser.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="text-left truncate min-w-0">
              <p className="font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-emerald-600 capitalize truncate">
                {currentUser.role} · {currentUser.tenant}
              </p>
            </div>
          )}
        </Button>
      </div>
    </>
  );
}

export function SidebarNavFallback() {
  return (
    <div className="flex h-full flex-col animate-pulse">
      <div className="h-20 border-b bg-slate-100" />
      <div className="flex-1 space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="h-20 border-t bg-slate-100" />
    </div>
  );
}

export default SidebarNav;