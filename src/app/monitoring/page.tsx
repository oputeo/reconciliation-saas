// src/app/monitoring/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, AlertTriangle, ChevronDown, ChevronUp 
} from "lucide-react";
import { useAuth } from "@/app/providers";
import { toast } from "sonner";

// Recharts
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export default function MonitoringPage() {
  const { profile } = useAuth();
  const currentTenant = profile?.tenant_name ?? 'Workspace';
  const [isLive, setIsLive] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Live Transaction Flow Data
  const [liveData, setLiveData] = useState([
    { time: "09:00", tx: 89, matched: 87 },
    { time: "09:05", tx: 124, matched: 119 },
    { time: "09:10", tx: 98, matched: 96 },
    { time: "09:15", tx: 156, matched: 152 },
    { time: "09:20", tx: 142, matched: 138 },
  ]);

  // Duplicate Transaction Monitoring
  const [duplicateTransactions] = useState([
    {
      id: "DUP-001",
      transaction_id: "TXN-987654321",
      bank: "GTBank",
      amount: "₦2,450,000",
      timestamp: "2 min ago",
      count: 2,
      description: "Same transaction ID posted twice in different batches",
      status: "Open"
    },
    {
      id: "DUP-002",
      transaction_id: "TXN-456789123",
      bank: "Access Bank",
      amount: "₦1,875,000",
      timestamp: "17 min ago",
      count: 3,
      description: "Multiple credits with identical reference",
      status: "Investigating"
    },
  ]);

  // Simulate live updates
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setLiveData(prev => {
        const last = prev[prev.length - 1];
        const newTx = Math.floor(last.tx * (0.9 + Math.random() * 0.45));
        return [...prev.slice(1), {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          tx: newTx,
          matched: Math.floor(newTx * 0.97)
        }];
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [isLive]);

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const acknowledgeDuplicate = (id: string) => {
    toast.success(`Duplicate transaction ${id} acknowledged and logged`);
    setExpandedRow(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Live Monitoring</h1>
          <p className="text-slate-600">Real-time Transaction & Duplicate Detection • {currentTenant?.name}</p>
        </div>
        <Button 
          variant={isLive ? "destructive" : "default"} 
          onClick={() => setIsLive(!isLive)}
        >
          {isLive ? "Pause Live Feed" : "Resume Live Feed"}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="fin-card p-6">
          <p className="text-sm text-slate-600">Transactions/sec</p>
          <p className="text-4xl font-semibold mt-2">142</p>
        </Card>
        <Card className="fin-card p-6">
          <p className="text-sm text-slate-600">Match Rate</p>
          <p className="text-4xl font-semibold mt-2 text-emerald-600">98.7%</p>
        </Card>
        <Card className="fin-card p-6">
          <p className="text-sm text-slate-600">Active Duplicates</p>
          <p className="text-4xl font-semibold mt-2 text-amber-600">7</p>
        </Card>
        <Card className="fin-card p-6">
          <p className="text-sm text-slate-600">System Status</p>
          <p className="text-4xl font-semibold mt-2 text-emerald-600">Healthy</p>
        </Card>
      </div>

      {/* Live Transaction Chart */}
      <Card className="fin-card p-8">
        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-semibold">Live Transaction Flow</h2>
          <Badge variant="outline">Real-time</Badge>
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <AreaChart data={liveData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Area type="natural" dataKey="tx" stroke="#2563eb" fill="#dbeafe" strokeWidth={3} />
            <Area type="natural" dataKey="matched" stroke="#10b981" fill="#d1fae5" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Duplicate Transaction Monitoring */}
      <Card className="fin-card overflow-hidden">
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertTriangle className="text-red-600" /> Duplicate Transaction ID Monitoring
          </h2>
          <Badge variant="outline">Live Detection</Badge>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="text-left py-5 px-6">Transaction ID</th>
              <th className="text-left py-5 px-6">Bank</th>
              <th className="text-right py-5 px-6">Amount</th>
              <th className="text-center py-5 px-6">Occurrences</th>
              <th className="text-center py-5 px-6">Detected</th>
              <th className="w-40"></th>
            </tr>
          </thead>
          <tbody>
            {duplicateTransactions.map((dup) => (
              <React.Fragment key={dup.id}>
                <tr className="border-b hover:bg-slate-50">
                  <td className="py-5 px-6 font-mono">{dup.transaction_id}</td>
                  <td className="py-5 px-6 font-medium">{dup.bank}</td>
                  <td className="py-5 px-6 text-right font-medium text-amber-600">{dup.amount}</td>
                  <td className="py-5 px-6 text-center">
                    <Badge className="bg-red-100 text-red-700">{dup.count} times</Badge>
                  </td>
                  <td className="py-5 px-6 text-center text-sm text-slate-500">{dup.timestamp}</td>
                  <td className="py-5 px-6">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toggleRow(dup.id)}
                    >
                      {expandedRow === dup.id ? "Hide" : "Investigate"}
                      {expandedRow === dup.id ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
                    </Button>
                  </td>
                </tr>

                {/* Expandable Details */}
                {expandedRow === dup.id && (
                  <tr className="bg-slate-50">
                    <td colSpan={6} className="p-8">
                      <div className="bg-white border rounded-2xl p-8">
                        <h3 className="font-semibold text-lg mb-6">Duplicate Transaction Analysis</h3>
                        
                        <div className="grid md:grid-cols-2 gap-8 mb-8">
                          <div>
                            <p className="text-sm text-slate-500 mb-1">DESCRIPTION</p>
                            <p className="text-slate-700">{dup.description}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-500 mb-1">RECOMMENDED ACTION</p>
                            <p className="text-slate-700">Reverse duplicate instance and flag for manual review.</p>
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <Button variant="outline" onClick={() => setExpandedRow(null)}>Cancel</Button>
                          <Button onClick={() => acknowledgeDuplicate(dup.id)} className="accent-btn">
                            Acknowledge & Resolve
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}