// src/components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, RefreshCw, Wallet, AlertTriangle, FileText, 
  Users, Settings, Shield, Menu, TrendingUp 
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const allNavItems = [
  { name: "Dashboard", href: "/", icon: Home, roles: ["all"] },
  { name: "Reconciliation", href: "/reconciliation", icon: RefreshCw, roles: ["all"] },
  { name: "Transactions", href: "/transactions", icon: Wallet, roles: ["all"] },
  { name: "Anomalies", href: "/anomalies", icon: AlertTriangle, roles: ["all"] },
  { name: "Live Monitoring", href: "/monitoring", icon: TrendingUp, roles: ["all"] },   // ← Added
  { name: "Reports", href: "/reports", icon: FileText, roles: ["all"] },
  { name: "IAM & Access", href: "/iam", icon: Users, roles: ["System Administrator", "Senior Reconciliation Officer"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["all"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { currentUser, setRole } = useAuthStore();

  useEffect(() => setMounted(true), []);

  const visibleNavItems = allNavItems.filter(item => 
    item.roles.includes("all") || item.roles.includes(currentUser.role)
  );

  return (
    <div className={`h-screen fixed bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-50 flex flex-col overflow-hidden
      ${sidebarCollapsed ? "w-0 -translate-x-full" : "w-72"}`}>

      {/* Header */}
      <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">ReconFlow</h1>
        <button onClick={toggleSidebar} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-medium transition-all
                ${isActive 
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" 
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Role Switcher + User Info */}
      <div className="p-4 border-t dark:border-slate-800 space-y-4">
        {/* Quick Role Switcher */}
        <div>
          <p className="text-xs text-slate-500 mb-2">TEST ROLE SWITCHER</p>
          <Select 
            value={currentUser.role} 
            onValueChange={(role: any) => setRole(role)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Senior Reconciliation Officer">Senior Reconciliation Officer</SelectItem>
              <SelectItem value="Reconciliation Officer">Reconciliation Officer</SelectItem>
              <SelectItem value="Finance Approver">Finance Approver</SelectItem>
              <SelectItem value="System Administrator">System Administrator</SelectItem>
              <SelectItem value="Auditor">Auditor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Current User */}
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-slate-200 font-medium">
              {currentUser.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{currentUser.name}</p>
            <p className="text-xs text-slate-500">{currentUser.role}</p>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>
    </div>
  );
}