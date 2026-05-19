// src/components/layout/BottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, RefreshCw, CreditCard, FileText, Users } from "lucide-react";

const bottomNavItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Recon", href: "/reconciliation", icon: RefreshCw },
  { name: "Txns", href: "/transactions", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "IAM", href: "/iam", icon: Users },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 z-50 safe-area-bottom">
      <div className="flex items-center justify-around py-2 max-w-md mx-auto">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-3 transition-all ${isActive ? "text-emerald-600" : "text-slate-500 dark:text-slate-400"}`}
            >
              <item.icon className={`w-6 h-6 mb-1 ${isActive ? "scale-110" : ""}`} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}