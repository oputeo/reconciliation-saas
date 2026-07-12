'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  ShieldCheck, AlertTriangle, Target, TrendingUp, Download, Database, RefreshCw, BarChart2
} from 'lucide-react';
import { toast } from 'sonner';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import {
  exportMetricsCsv,
  fetchProductBreakdown,
  fetchReportMetrics,
  fetchTrendData,
} from '@/lib/reports/metrics';

// Recharts
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

export default function ReconFlowReport() {
  const { tenantId, isReady } = useActiveTenant();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRecords: 0,
    accuracy: 0,
    totalLeakage: 0,
    riskScore: 0,
    lastUpdated: ""
  });

  const [trendData, setTrendData] = useState<any[]>([]);
  const [productData, setProductData] = useState<any[]>([]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [reportMetrics, trend, products] = await Promise.all([
        fetchReportMetrics(tenantId),
        fetchTrendData(tenantId),
        fetchProductBreakdown(tenantId),
      ]);

      setMetrics({
        totalRecords: reportMetrics.totalRecords,
        accuracy: reportMetrics.accuracy,
        totalLeakage: reportMetrics.totalLeakage,
        riskScore: reportMetrics.riskScore,
        lastUpdated: reportMetrics.lastUpdated,
      });
      setTrendData(trend);
      setProductData(products);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const csv = exportMetricsCsv(
        {
          totalRecords: metrics.totalRecords,
          matchedRecords: 0,
          unmatchedRecords: 0,
          pendingRecords: 0,
          accuracy: metrics.accuracy,
          totalLeakage: metrics.totalLeakage,
          riskScore: metrics.riskScore,
          openAnomalies: 0,
          lastUpdated: metrics.lastUpdated,
        },
        trendData,
      );
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reconflow-report-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch {
      toast.error('CSV export failed');
    }
  };

  useEffect(() => {
    if (isReady) fetchReportData();
  }, [tenantId, isReady]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-bold text-slate-900">ReconFlow Report</h1>
            <p className="text-xl text-slate-600 mt-2">Top Management Intelligence Platform • Master Ledger as Single Source of Truth</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button size="lg" variant="outline" asChild className="gap-3">
              <Link href="/reports/products">
                <BarChart2 className="h-5 w-5" /> Product Reconciliation
              </Link>
            </Button>
            <Button size="lg" variant="outline" onClick={handleExportCsv} className="gap-3">
              <Download className="h-5 w-5" /> Export CSV
            </Button>
            <Button size="lg" onClick={fetchReportData} disabled={loading} className="gap-3">
              <RefreshCw className="h-5 w-5" /> Refresh Report
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Executive Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-8">
                <Database className="h-12 w-12 text-blue-600 mb-4" />
                <p className="text-6xl font-bold">{metrics.totalRecords.toLocaleString()}</p>
                <p className="text-slate-600 mt-2">Total Records in Master Ledger</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <ShieldCheck className="h-12 w-12 text-emerald-600 mb-4" />
                <p className="text-6xl font-bold text-emerald-600">{metrics.accuracy}%</p>
                <p className="text-slate-600 mt-2">Reconciliation Accuracy</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <AlertTriangle className="h-12 w-12 text-red-600 mb-4" />
                <p className="text-6xl font-bold text-red-600">₦{metrics.totalLeakage.toLocaleString()}</p>
                <p className="text-slate-600 mt-2">Potential Revenue Leakage</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <Target className="h-12 w-12 text-amber-600 mb-4" />
                <p className="text-6xl font-bold">{metrics.riskScore}</p>
                <p className="text-slate-600 mt-2">Overall Risk Score</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Monthly Accuracy vs Leakage Trend</h2>
          <Card>
            <CardContent className="p-8">
              <ResponsiveContainer width="100%" height={420}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis yAxisId="left" stroke="#10b981" />
                  <YAxis yAxisId="right" orientation="right" stroke="#ef4444" />
                  <Tooltip />
                  <Line yAxisId="left" type="natural" dataKey="accuracy" stroke="#10b981" strokeWidth={5} dot={{ r: 6 }} name="Accuracy %" />
                  <Line yAxisId="right" type="natural" dataKey="leakage" stroke="#ef4444" strokeWidth={4} dot={{ r: 5 }} name="Leakage (₦)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Product Performance */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Product Performance Breakdown</h2>
          <Card>
            <CardContent className="p-8">
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={productData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="volume" fill="#3b82f6" name="Transaction Volume" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-12">
          Last updated: {metrics.lastUpdated} • Powered by Master Ledger (Single Source of Truth)
        </p>
      </div>
    </div>
  );
}