// src/app/forecasting/page.tsx
"use client";

import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Target, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useState } from "react";

const historicalData = [
  { month: "Jan", leakage: 12400000 },
  { month: "Feb", leakage: 15800000 },
  { month: "Mar", leakage: 13900000 },
  { month: "Apr", leakage: 17200000 },
  { month: "May", leakage: 18400000 },
];

const forecastData = [
  { month: "Jun", predicted: 20500000, confidence: 92, risk: "Medium" },
  { month: "Jul", predicted: 21800000, confidence: 88, risk: "High" },
  { month: "Aug", predicted: 23100000, confidence: 85, risk: "High" },
  { month: "Sep", predicted: 24700000, confidence: 81, risk: "Critical" },
];

export default function ForecastingPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const runForecast = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowInsights(true);
    }, 1800);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Leakage Forecasting</h1>
              <p className="text-slate-600 dark:text-slate-400">Predictive Analytics • Risk Forecasting • Proactive Mitigation</p>
            </div>
            <Button onClick={runForecast} disabled={isGenerating}>
              {isGenerating ? "Running AI Model..." : "Run New Forecast"}
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="fin-card p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">Next 3 Months Predicted Leakage</p>
              <p className="text-4xl font-bold text-red-600 mt-3">₦68.1M</p>
              <p className="text-xs text-red-500 mt-2">↑ 23% from last forecast</p>
            </Card>
            <Card className="fin-card p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">Model Accuracy</p>
              <p className="text-4xl font-bold text-emerald-600 mt-3">89.4%</p>
            </Card>
            <Card className="fin-card p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">High Risk Months</p>
              <p className="text-4xl font-bold text-amber-600 mt-3">3</p>
            </Card>
            <Card className="fin-card p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">Potential Savings</p>
              <p className="text-4xl font-bold text-emerald-600 mt-3">₦14.2M</p>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="fin-card p-6">
              <h3 className="font-semibold mb-4">Historical vs Forecasted Leakage</h3>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={[...historicalData, ...forecastData.map((f, i) => ({ month: f.month, leakage: f.predicted }))]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="leakage" stroke="#ef4444" strokeWidth={4} name="Leakage (₦)" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="fin-card p-6">
              <h3 className="font-semibold mb-4">Monthly Risk Breakdown</h3>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="predicted" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* AI Insights */}
          {showInsights && (
            <Card className="fin-card mt-8 p-8">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Target className="w-6 h-6 text-emerald-600" />
                AI Strategic Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-emerald-50 dark:bg-emerald-950 rounded-2xl">
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">High Priority</p>
                  <p className="mt-3">Review and adjust NIBSS cutoff timing rules before June</p>
                  <p className="text-xs text-emerald-600 mt-4">Expected Impact: ₦8.4M savings</p>
                </div>
                <div className="p-6 bg-amber-50 dark:bg-amber-950 rounded-2xl">
                  <p className="font-medium text-amber-700 dark:text-amber-400">Medium Priority</p>
                  <p className="mt-3">Add Flutterwave & Interswitch to enhanced auto-match rules</p>
                  <p className="text-xs text-amber-600 mt-4">Expected Impact: ₦4.1M savings</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}