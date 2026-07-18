'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  RefreshCw,
  AlertTriangle,
  FileBarChart,
  Upload,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/app/providers';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import { useUIStore } from '@/store/uiStore';
import {
  SidebarQuickAccess,
  SidebarQuickAccessFallback,
} from '@/components/layout/SidebarQuickAccess';

const mainNav = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/executive', label: 'Executive Intelligence', icon: BarChart3 },
  { href: '/reconciliation', label: 'Live Reconciliation', icon: RefreshCw },
  { href: '/anomalies', label: 'Anomalies & Alerts', icon: AlertTriangle },
  { href: '/uploads', label: 'Bulk Uploads', icon: Upload },
  { href: '/reports', label: 'Reports & Exports', icon: FileBarChart },
];

function useSidebarState() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);

  const pathname = usePathname();
  const { profile, signOut, hasPermission, loading } = useAuth();
  const { tenantName } = useActiveTenant();

  const isAdmin = !loading && hasPermission('admin');

  const currentUser = {
    name: !loading
      ? profile?.full_name || profile?.email?.split('@')[0] || 'User'
      : 'User',
    role: !loading ? profile?.role || 'viewer' : 'viewer',
    tenant: !loading ? tenantName || profile?.tenant_name || 'Workspace' : 'Workspace',
    avatar: !loading ? profile?.avatar_url || '' : '',
  };

  const closeMobileNav = () => setMobileSidebarOpen(false);

  const handleLogout = async () => {
    closeMobileNav();
    await signOut();
    window.location.href = '/login';
  };

  return {
    collapsed,
    toggleSidebar,
    closeMobileNav,
    pathname,
    isAdmin,
    currentUser,
    handleLogout,
  };
}

/** Desktop nav body - rendered inside AppShell grid column (in document flow). */
export function SidebarNav() {
  return <SidebarNavContent />;
}

function SidebarNavContent() {
  const {
    collapsed,
    toggleSidebar,
    closeMobileNav,
    pathname,
    isAdmin,
    currentUser,
    handleLogout,
  } = useSidebarState();

  const navLinkClass = (isActive: boolean) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
      isActive
        ? 'bg-emerald-600 text-white shadow-sm'
        : 'text-slate-700 hover:bg-slate-100'
    } ${collapsed ? 'justify-center px-2' : ''}`;

  return (
    <>
      <div
        className={`border-b bg-white shrink-0 ${
          collapsed
            ? 'flex flex-col items-center gap-2 py-3 px-2'
            : 'h-20 px-3 flex items-center justify-between gap-2'
        }`}
      >
        <div className={`flex items-center gap-3 min-w-0 ${collapsed ? '' : 'flex-1'}`}>
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
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 border-slate-200 bg-white shadow-sm z-10"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
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
              onClick={closeMobileNav}
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {!collapsed && (
          <Suspense fallback={<SidebarQuickAccessFallback />}>
            <SidebarQuickAccess
              pathname={pathname}
              isAdmin={isAdmin}
              tenantLabel={currentUser.tenant}
              navLinkClass={navLinkClass}
              onNavigate={closeMobileNav}
            />
          </Suspense>
        )}
      </nav>

      <Separator />

      <div className={`bg-slate-50 border-t border-slate-100 shrink-0 ${collapsed ? 'p-2' : 'p-4'}`}>
        <Button
          type="button"
          variant="ghost"
          className={`w-full h-auto rounded-xl hover:bg-white ${
            collapsed ? 'justify-center p-2' : 'justify-start gap-3 p-3'
          }`}
          onClick={handleLogout}
          title="Sign out"
        >
          <Avatar className="h-10 w-10 border border-slate-200 shrink-0">
            <AvatarImage src={currentUser.avatar} />
            <AvatarFallback
              className="bg-emerald-100 text-emerald-700 font-medium"
              suppressHydrationWarning
            >
              {currentUser.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="text-left truncate min-w-0" suppressHydrationWarning>
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