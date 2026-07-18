'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarNav, SidebarNavFallback } from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import {
  SIDEBAR_WIDTH_COLLAPSED,
  SIDEBAR_WIDTH_EXPANDED,
  useUIStore,
} from '@/store/uiStore';
import { useIsClient } from '@/lib/useIsClient';

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
  const mobileOpen = useUIStore((s) => s.mobileSidebarOpen);
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const isClient = useIsClient();
  const sidebarWidth =
    isClient && collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  const layoutClass = [
    'app-shell-layout',
    mobileOpen ? 'app-shell-mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-slate-50">
      <Header />

      <div
        className={layoutClass}
        style={{ ['--sidebar-width' as string]: `${sidebarWidth}px` }}
        suppressHydrationWarning
      >
        <button
          type="button"
          className="app-shell-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileSidebarOpen(false)}
        />

        <aside className="app-shell-sidebar" aria-label="Main navigation">
          <Suspense fallback={<SidebarNavFallback />}>
            <SidebarNav />
          </Suspense>
        </aside>

        <main className="app-shell-main">
          <div className="app-shell-main-inner">{children}</div>
        </main>
      </div>

      <BottomNav />
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