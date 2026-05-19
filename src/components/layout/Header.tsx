// src/components/layout/Header.tsx
"use client";

import { Menu } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

export default function Header() {
  const { toggleSidebar } = useUIStore();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 z-50 flex items-center px-6">
      <button
        onClick={toggleSidebar}
        className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
      >
        <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
      </button>

      <div className="ml-4">
        <h1 className="font-semibold text-lg text-slate-900 dark:text-white">ReconFlow</h1>
      </div>
    </header>
  );
}