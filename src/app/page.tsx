// src/app/page.tsx
"use client";

import Sidebar from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";

export default function Dashboard() {
  const { currentUser } = useAuthStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getRoleMessage = () => {
    if (currentUser.role.includes("Senior Reconciliation")) 
      return "You're leading reconciliation operations today.";
    if (currentUser.role.includes("Finance")) 
      return "Financial oversight and approvals are active.";
    if (currentUser.role.includes("Administrator")) 
      return "Full system control enabled.";
    return "Here's an overview of reconciliation operations.";
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            {getGreeting()}, {currentUser.name.split(" ")[0]} 👋
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mt-2">
            {getRoleMessage()}
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10">
            <Card className="fin-card p-6">
              <p className="text-sm text-slate-600">Total Breaks</p>
              <p className="text-5xl font-bold text-orange-600 mt-3">248</p>
            </Card>
            <Card className="fin-card p-6">
              <p className="text-sm text-slate-600">Match Rate</p>
              <p className="text-5xl font-bold text-emerald-600 mt-3">98.7%</p>
            </Card>
            <Card className="fin-card p-6">
              <p className="text-sm text-slate-600">Today's Volume</p>
              <p className="text-5xl font-bold mt-3">2.84M</p>
            </Card>
            <Card className="fin-card p-6">
              <p className="text-sm text-slate-600">Risk Exposure</p>
              <p className="text-5xl font-bold text-red-600 mt-3">₦18.4M</p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}