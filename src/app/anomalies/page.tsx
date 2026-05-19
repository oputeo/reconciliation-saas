// src/app/anomalies/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useUIStore } from "@/store/uiStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, ArrowUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Anomaly = {
  id: string;
  type: string;
  description: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  time: string;
  amount?: number;
};

export default function AnomaliesPage() {
  const { sidebarCollapsed } = useUIStore();
  
  const [anomalies, setAnomalies] = useState<Anomaly[]>([
    { id: "ANM-7842", type: "High Value Spike", description: "₦45M transaction from new merchant", severity: "Critical", time: "2 min ago", amount: 45000000 },
    { id: "ANM-7841", type: "Unusual Pattern", description: "Multiple failed retries on same account", severity: "High", time: "17 min ago" },
    { id: "ANM-7840", type: "Velocity Breach", description: "User exceeded daily transaction limit", severity: "Medium", time: "41 min ago" },
  ]);

  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);

  // Simulate new anomalies
  useEffect(() => {
    const interval = setInterval(() => {
      const types = ["High Value Spike", "Velocity Breach", "Unusual Pattern", "Geolocation Anomaly"];
      const newAnomaly: Anomaly = {
        id: `ANM-${Date.now().toString().slice(-6)}`,
        type: types[Math.floor(Math.random() * types.length)],
        description: "Suspicious activity detected by AI engine",
        severity: Math.random() > 0.7 ? "Critical" : Math.random() > 0.4 ? "High" : "Medium",
        time: "Just now",
        amount: Math.random() > 0.6 ? Math.floor(Math.random() * 45000000) + 5000000 : undefined,
      };
      setAnomalies(prev => [newAnomaly, ...prev.slice(0, 8)]);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-red-600 text-white";
      case "High": return "bg-orange-600 text-white";
      case "Medium": return "bg-amber-600 text-white";
      default: return "bg-slate-600 text-white";
    }
  };

  const resolveAnomaly = (id: string) => {
    setAnomalies(prev => prev.filter(a => a.id !== id));
    setSelectedAnomaly(null);
    alert("✅ Anomaly marked as Resolved and logged.");
  };

  const escalateAnomaly = (anomaly: Anomaly) => {
    alert(`🚨 Anomaly ${anomaly.id} escalated to Compliance Team with high priority.`);
    setSelectedAnomaly(null);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className={`flex-1 transition-all duration-300 p-8 ${sidebarCollapsed ? "ml-0" : "ml-72"}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Anomaly Detection</h1>
              <p className="text-slate-600">AI-Powered Real-time Fraud & Pattern Monitoring</p>
            </div>
            <Button>Run Full System Scan</Button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="fin-card p-6">
              <p className="text-sm text-slate-600">Active Anomalies</p>
              <p className="text-5xl font-bold text-red-600 mt-3">{anomalies.length}</p>
            </Card>
            <Card className="fin-card p-6">
              <p className="text-sm text-slate-600">Today Resolved</p>
              <p className="text-5xl font-bold text-emerald-600 mt-3">47</p>
            </Card>
            <Card className="fin-card p-6">
              <p className="text-sm text-slate-600">Avg Response Time</p>
              <p className="text-5xl font-bold mt-3">4.2m</p>
            </Card>
            <Card className="fin-card p-6">
              <p className="text-sm text-slate-600">Detection Accuracy</p>
              <p className="text-5xl font-bold text-emerald-600 mt-3">97.8%</p>
            </Card>
          </div>

          {/* Live Anomalies */}
          <Card className="fin-card overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-semibold">Live Detected Anomalies</h2>
              <Badge variant="destructive">{anomalies.length} Active</Badge>
            </div>

            <div className="divide-y">
              {anomalies.map((anomaly) => (
                <div key={anomaly.id} className="p-6 flex justify-between items-center hover:bg-slate-50">
                  <div className="flex gap-4">
                    <AlertTriangle className="w-6 h-6 text-red-500 mt-1" />
                    <div>
                      <p className="font-medium">{anomaly.type}</p>
                      <p className="text-sm text-slate-600">{anomaly.description}</p>
                      {anomaly.amount && <p className="text-sm font-medium mt-1">Amount: ₦{anomaly.amount.toLocaleString()}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge className={getSeverityColor(anomaly.severity)}>{anomaly.severity}</Badge>
                    <p className="text-xs text-slate-500 w-20">{anomaly.time}</p>
                    <Button size="sm" variant="outline" onClick={() => setSelectedAnomaly(anomaly)}>
                      Investigate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      {/* Enhanced Investigation Modal */}
      <Dialog open={!!selectedAnomaly} onOpenChange={() => setSelectedAnomaly(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="text-red-600" />
              Anomaly Investigation
            </DialogTitle>
          </DialogHeader>

          {selectedAnomaly && (
            <div className="space-y-6 py-4">
              <div className="bg-red-50 dark:bg-red-950 p-5 rounded-2xl">
                <p className="text-xl font-semibold text-red-800 dark:text-red-200">{selectedAnomaly.type}</p>
                <p className="text-red-700 dark:text-red-300 mt-2">{selectedAnomaly.description}</p>
                {selectedAnomaly.amount && (
                  <p className="text-red-700 dark:text-red-300 font-medium mt-2">Amount Involved: ₦{selectedAnomaly.amount.toLocaleString()}</p>
                )}
              </div>

              <div>
                <p className="font-medium mb-3 text-lg">🤖 AI Recommended Actions</p>
                <ul className="space-y-3 text-sm">
                  <li className="flex gap-3"><CheckCircle className="text-emerald-600 mt-0.5" /> Temporarily block transaction</li>
                  <li className="flex gap-3"><CheckCircle className="text-emerald-600 mt-0.5" /> Contact merchant for verification</li>
                  <li className="flex gap-3"><CheckCircle className="text-emerald-600 mt-0.5" /> Add to high-risk watchlist</li>
                  <li className="flex gap-3"><CheckCircle className="text-emerald-600 mt-0.5" /> Escalate to compliance team</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700" 
                  onClick={() => resolveAnomaly(selectedAnomaly.id)}
                >
                  Acknowledge & Resolve
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 border-red-600 text-red-600 hover:bg-red-50" 
                  onClick={() => escalateAnomaly(selectedAnomaly)}
                >
                  Escalate to Compliance
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}