'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SidebarNav, SidebarNavFallback } from '@/components/layout/Sidebar';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sidebarWidth = mounted && collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-hidden bg-slate-50">
      <div
        className="app-shell-layout"
        style={{ ['--sidebar-width' as string]: `${sidebarWidth}px` }}
        suppressHydrationWarning
      >
        <aside className="app-shell-sidebar" aria-label="Main navigation">
          <Suspense fallback={<SidebarNavFallback />}>
            <SidebarNav />
          </Suspense>
        </aside>

        <main className="app-shell-main">
          <div className="app-shell-main-inner">
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