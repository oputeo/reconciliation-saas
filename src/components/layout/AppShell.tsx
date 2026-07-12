'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
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
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>

      {/*
        Desktop: in-flow spacer reserves sidebar width; fixed sidebar draws over spacer.
        Main is a flex sibling — it can never sit under the expanded sidebar.
        Mobile: no spacer; full-width main + overlay drawer.
      */}
      <div className="flex min-h-screen w-full min-w-0">
        <div
          className="app-shell-sidebar-spacer hidden shrink-0 transition-[width] duration-300 ease-in-out lg:block"
          style={{ width: sidebarWidth }}
          aria-hidden="true"
        />
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
