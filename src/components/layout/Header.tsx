// src/components/layout/Header.tsx
'use client';

import { Menu } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/button';

export default function Header() {
  const toggleMobileSidebar = useUIStore((s) => s.toggleMobileSidebar);

  return (
    <header className="app-shell-mobile-header">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={toggleMobileSidebar}
        className="shrink-0 border-slate-200 bg-white shadow-sm"
        aria-label="Open navigation menu"
      >
        <Menu className="size-5 text-slate-700" />
      </Button>

      <div className="ml-3 min-w-0">
        <h1 className="font-semibold text-lg text-slate-900 truncate">ReconFlow</h1>
        <p className="text-xs text-emerald-600 -mt-0.5">Revenue Assurance</p>
      </div>
    </header>
  );
}