'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { SIDEBAR_WIDTH_EXPANDED } from '@/store/uiStore';

const PUBLIC_EXACT = new Set(['/']);
const PUBLIC_PREFIXES = ['/login', '/sign-in', '/accept-invite', '/access-denied'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full min-w-0 bg-slate-50 lg:flex">
      <Suspense
        fallback={
          <div
            className="hidden lg:block shrink-0 border-r border-slate-200 bg-white"
            style={{ width: SIDEBAR_WIDTH_EXPANDED }}
            aria-hidden
          />
        }
      >
        <Sidebar />
      </Suspense>

      {/*
        Desktop: flex sibling — main always fills remaining width (no overlap when sidebar expands).
        Mobile: full-width page + overlay drawer.
      */}
      <main className="app-shell-main min-h-screen min-w-0 flex-1 overflow-x-hidden overflow-y-auto pt-14 lg:pt-0">
        <div className="min-h-full w-full min-w-0 max-w-full p-4 sm:p-6 lg:p-8 pb-20 lg:max-w-[1600px] lg:mx-auto">
          {children}
        </div>
      </main>
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
