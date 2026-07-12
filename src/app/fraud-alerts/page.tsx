// src/app/fraud-alerts/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertTriangle, ShieldAlert, Zap, Eye, Ban, ArrowUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/providers";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type FraudAlert = {
  id: string;
  type: string;
  description: string;
  severity: "Critical" | "High" | "Medium";
  amount: number;
  merchant: string;
  time: string;
  confidence: number;
  status: "Active" | "Investigating" | "Resolved";
};

export default function FraudAlertsPage() {
  const { hasPermission } = useAuth();
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"All" | "Critical" | "High">("All");

  useEffect(() => {
    // Simulate real-time fraud detection
    const initialAlerts: FraudAlert[] = [
      { id: "FRA-7842", type: "Velocity Attack", description: "Multiple high-value transactions in 5 minutes", severity: "Critical", amount: 45000000, merchant: "New_Merchant_991", time: "3 min ago", confidence: 97, status: "Active" },
      { id: "FRA-7841", type: "Geolocation Anomaly", description: "Transaction from unusual location (Lagos → Dubai in 12 mins)", severity: "High", amount: 8750000, merchant: "Premium_Store", time: "18 min ago", confidence: 89, status: "Investigating" },
      { id: "FRA-7840", type: "Amount Spike", description: "Sudden 400% increase from normal pattern", severity: "Medium", amount: 3200000, merchant: "Tech_Solutions", time: "47 min ago", confidence: 76, status: "Active" },
    ];

    setAlerts(initialAlerts);
    setLoading(false);

    // Simulate new fraud alerts
    const interval = setInterval(() => {
      const newAlert: FraudAlert = {
        id: `FRA-${Date.now().toString().slice(-4)}`,
        type: ["Velocity Attack", "Geolocation Anomaly", "Mule Account Pattern"][Math.floor(Math.random() * 3)],
        description: "Suspicious pattern detected by AI engine",
        severity: Math.random() > 0.6 ? "Critical" : "High",
        amount: Math.floor(Math.random() * 45000000) + 5000000,
        merchant: "Unknown_Merchant_" + Math.floor(Math.random() * 999),
        time: "Just now",
        confidence: Math.floor(Math.random() * 25) + 75,
        status: "Active"
      };
      setAlerts(prev => [newAlert, ...prev.slice(0, 7)]);
    }, 8500);

    return () => clearInterval(interval);
  }, []);

  const filteredAlerts = filter === "All" ? alerts : alerts.filter(a => a.severity === filter);

  const criticalCount = alerts.filter(a => a.severity === "Critical").length;
  const highCount = alerts.filter(a => a.severity === "High").length;

  const getSeverityColor = (severity: string) => {
    if (severity === "Critical") return "bg-red-600 text-white";
    if (severity === "High") return "bg-orange-600 text-white";
    return "bg-amber-600 text-white";
  };

  const resolveAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => alert.id === id ? { ...alert, status: "Resolved" } : alert));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Fraud Alert Center</h1>
          <p className="text-zinc-400 text-lg mt-1">AI-Powered Real-time Fraud Detection • Live Monitoring</p>
        </div>
        <Badge variant="destructive" className="text-lg px-4 py-2">
          {alerts.length} Active Alerts
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 border-red-600">
          <CardHeader className="pb-3"><CardTitle className="text-sm text-red-400">Critical Alerts</CardTitle></CardHeader>
          <CardContent><p className="text-5xl font-bold text-red-500">{criticalCount}</p></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-orange-600">
          <CardHeader className="pb-3"><CardTitle className="text-sm text-orange-400">High Risk</CardTitle></CardHeader>
          <CardContent><p className="text-5xl font-bold text-orange-500">{highCount}</p></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3"><CardTitle className="text-sm text-zinc-400">Avg Confidence</CardTitle></CardHeader>
          <CardContent><p className="text-5xl font-bold text-emerald-500">91%</p></CardContent>
        </Card>
        <Card className="bg-zinc-900 border-emerald-600">
          <CardHeader className="pb-3"><CardTitle className="text-sm text-emerald-400">Resolved Today</CardTitle></CardHeader>
          <CardContent><p className="text-5xl font-bold text-emerald-500">47</p></CardContent>
        </Card>
      </div>

      {/* Live Alerts */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Live Fraud Alerts</CardTitle>
            <div className="flex gap-2">
              <Button variant={filter === "All" ? "default" : "outline"} size="sm" onClick={() => setFilter("All")}>All</Button>
              <Button variant={filter === "Critical" ? "default" : "outline"} size="sm" onClick={() => setFilter("Critical")}>Critical</Button>
              <Button variant={filter === "High" ? "default" : "outline"} size="sm" onClick={() => setFilter("High")}>High</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-800">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-zinc-950">
                <div className="flex gap-4">
                  <ShieldAlert className="w-6 h-6 text-red-500 mt-1" />
                  <div>
                    <p className="font-semibold">{alert.type}</p>
                    <p className="text-zinc-400">{alert.description}</p>
                    <p className="text-emerald-400 font-mono mt-1">₦{alert.amount.toLocaleString()} • {alert.merchant}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <Badge className={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                  <div className="text-right">
                    <p className="text-emerald-400 font-medium">{alert.confidence}% Confidence</p>
                    <p className="text-xs text-zinc-500">{alert.time}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => resolveAlert(alert.id)}>
                      Resolve
                    </Button>
                    <Button size="sm" variant="destructive">
                      Escalate
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}