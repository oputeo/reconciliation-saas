// src/app/fraud-analytics/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const trendData = [
  { time: "00:00", alerts: 12 }, { time: "04:00", alerts: 8 }, { time: "08:00", alerts: 25 },
  { time: "12:00", alerts: 42 }, { time: "16:00", alerts: 38 }, { time: "20:00", alerts: 51 }
];

const severityData = [
  { name: "Critical", value: 18, color: "#ef4444" },
  { name: "High", value: 47, color: "#f59e0b" },
  { name: "Medium", value: 35, color: "#eab308" }
];

export default function FraudAnalyticsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold tracking-tight">Fraud Analytics Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Fraud Alert Trend (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                <XAxis dataKey="time" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip />
                <Line type="monotone" dataKey="alerts" stroke="#ef4444" strokeWidth={4} dot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={80} outerRadius={130} dataKey="value">
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}