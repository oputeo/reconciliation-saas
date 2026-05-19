// src/app/monitoring/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingUp, AlertTriangle, Zap } from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from "recharts";

type LiveTransaction = {
  id: string;
  time: string;
  amount: number;
  source: string;
  destination: string;
  status: "Success" | "Failed" | "Pending";
  matchRate: number;
};

const statusColors = {
  Success: "#10b981",
  Failed: "#ef4444",
  Pending: "#f59e0b",
};

export default function MonitoringPage() {
  const { sidebarCollapsed } = useUIStore();
  const { currentUser } = useAuthStore();
  const router = useRouter();

  // Role Protection: Only these roles can access Live Monitoring
  const allowedRoles = ["System Administrator", "Senior Reconciliation Officer", "Reconciliation Officer"];

  useEffect(() => {
    if (!allowedRoles.includes(currentUser.role)) {
      alert("⛔ Access Denied: Only Reconciliation and Administrative roles can access Live Monitoring.");
      router.push("/");
    }
  }, [currentUser.role, router]);

  // If not authorized, don't render the page
  if (!allowedRoles.includes(currentUser.role)) {
    return null;
  }

  const [transactions, setTransactions] = useState<LiveTransaction[]>([
    { id: "TXN-7849201", time: "Just now", amount: 2450000, source: "NIBSS", destination: "Wallet", status: "Success", matchRate: 100 },
    { id: "TXN-7849200", time: "1 min ago", amount: 875500, source: "Paystack", destination: "Core Banking", status: "Success", matchRate: 98 },
  ]);

  const [volume, setVolume] = useState(2840000);
  const [matchRate, setMatchRate] = useState(98.7);
  const [alerts, setAlerts] = useState([
    { id: 1, message: "High value spike detected (₦45M from new merchant)", severity: "High", time: "2 min ago" },
    { id: 2, message: "Unusual retry pattern on account ****7890", severity: "Medium", time: "17 min ago" },
  ]);

  const [volumeData, setVolumeData] = useState([
    { time: "10:00", volume: 420000 }, { time: "10:05", volume: 680000 },
    { time: "10:10", volume: 950000 }, { time: "10:15", volume: 1240000 },
  ]);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newTxn: LiveTransaction = {
        id: `TXN-${Math.floor(Math.random() * 9000000) + 1000000}`,
        time: "Just now",
        amount: Math.floor(Math.random() * 3500000) + 300000,
        source: ["NIBSS", "Paystack", "Flutterwave", "Interswitch"][Math.floor(Math.random() * 4)],
        destination: ["Wallet", "Core Banking", "Settlement"][Math.floor(Math.random() * 3)],
        status: Math.random() > 0.15 ? "Success" : "Failed",
        matchRate: Math.floor(Math.random() * 6) + 94,
      };

      setTransactions(prev => [newTxn, ...prev.slice(0, 8)]);
      setVolume(prev => prev + Math.floor(Math.random() * 65000) + 12000);
      setMatchRate(prev => Math.max(96, Math.min(99.8, prev + (Math.random() - 0.5) * 0.4)));

      setVolumeData(prev => [...prev.slice(1), { 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
        volume: volume + Math.floor(Math.random() * 250000) 
      }]);
    }, 2200);

    return () => clearInterval(interval);
  }, [volume]);

  const statusCount = {
    Success: transactions.filter(t => t.status === "Success").length,
    Failed: transactions.filter(t => t.status === "Failed").length,
    Pending: transactions.filter(t => t.status === "Pending").length,
  };

  const pieData = [
    { name: "Success", value: statusCount.Success, color: "#10b981" },
    { name: "Failed", value: statusCount.Failed, color: "#ef4444" },
    { name: "Pending", value: statusCount.Pending, color: "#f59e0b" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className={`flex-1 transition-all duration-300 p-8 ${sidebarCollapsed ? "ml-0" : "ml-72"}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Real-Time Transaction Monitoring</h1>
              <p className="text-slate-600">Live • Intelligent • Actionable</p>
            </div>
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" /> Pause Feed
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <Card className="fin-card p-6 col-span-2">
              <p className="text-sm text-slate-600">Live Volume (Today)</p>
              <p className="text-5xl font-bold text-emerald-600 mt-3">₦{(volume/1000000).toFixed(1)}M</p>
            </Card>
            <Card className="fin-card p-6">
              <p className="text-sm text-slate-600">Match Rate</p>
              <p className="text-5xl font-bold text-emerald-600 mt-3">{matchRate.toFixed(1)}%</p>
            </Card>
            <Card className="fin-card p-6">
              <p className="text-sm text-slate-600">Txns / min</p>
              <p className="text-5xl font-bold mt-3">184</p>
            </Card>
            <Card className="fin-card p-6 border-red-200">
              <p className="text-sm text-red-600">Active Alerts</p>
              <p className="text-5xl font-bold text-red-600 mt-3">{alerts.length}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Volume Chart */}
            <Card className="fin-card p-6 lg:col-span-2">
              <h3 className="font-semibold mb-4">Transaction Volume Trend (Last 30 mins)</h3>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="natural" dataKey="volume" stroke="#10b981" strokeWidth={4} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Status Distribution */}
            <Card className="fin-card p-6">
              <h3 className="font-semibold mb-4">Transaction Status</h3>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                {pieData.map((entry, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                    <span className="text-sm">{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Live Alerts */}
          <Card className="fin-card mt-8">
            <div className="p-6 border-b flex justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <AlertTriangle className="text-red-500" /> Active Alerts & Anomalies
              </h2>
              <Badge variant="destructive">{alerts.length} Active</Badge>
            </div>
            <div className="divide-y">
              {alerts.map(alert => (
                <div key={alert.id} className="p-6 flex justify-between items-start">
                  <div className="flex gap-4">
                    <AlertTriangle className="w-6 h-6 text-red-500 mt-1" />
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-slate-500 mt-1">{alert.time}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">Investigate</Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Live Feed */}
          <Card className="fin-card mt-8">
            <div className="p-6 border-b bg-slate-50">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                Live Transaction Feed
              </h2>
            </div>
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-6 flex justify-between items-center hover:bg-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-sm">{tx.id}</div>
                    <div>
                      <p className="font-medium">{tx.source} → {tx.destination}</p>
                      <p className="text-sm text-slate-500">₦{tx.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={tx.status === "Success" ? "default" : "destructive"}>{tx.status}</Badge>
                    <p className="text-xs text-slate-500 mt-2">{tx.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}