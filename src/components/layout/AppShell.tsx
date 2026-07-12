'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import {
  SidebarMobileChrome,
  SidebarNav,
  SidebarNavFallback,
} from '@/components/layout/Sidebar';
import { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_EXPANDED, useUIStore } from '@/store/uiStore';

const PUBLIC_EXACT = new Set(['/']);
const PUBLIC_PREFIXES = ['/login', '/sign-in', '/accept-invite', '/access-denied'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const sidebarWidth = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-slate-50">
      <SidebarMobileChrome />

      {/*
        Desktop: sidebar is a direct flex child (in document flow, not fixed).
        Main content starts immediately after the sidebar column — no overlap possible.
      */}
      <div className="flex min-h-screen w-full min-w-0">
        <aside
          className="app-shell-sidebar hidden shrink-0 flex-col bg-white border-r border-slate-200 shadow-sm transition-[width] duration-300 ease-in-out overflow-hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:max-h-screen lg:z-40"
          style={{ width: sidebarWidth }}
          aria-label="Main navigation"
        >
          <Suspense fallback={<SidebarNavFallback />}>
            <SidebarNav />
          </Suspense>
        </aside>

        <main className="app-shell-main min-h-screen min-w-0 flex-1 overflow-x-hidden overflow-y-auto pt-14 lg:pt-0">
          <div className="min-h-full w-full min-w-0 max-w-full p-4 sm:p-6 lg:p-8 pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = isPublicPath(pathname);

  if (isPublic) {
    return (
      <div className="min-h-screen w-full min-w-0 overflow-x-hidden">
        {children}
      </div>
    );
  }

  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}