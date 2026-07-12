'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import {
  exportProductMetricsCsv,
  fetchProductReconMetrics,
  type ProductReconMetrics,
} from '@/lib/reports/productMetrics';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function ProductReconDashboardPage() {
  const { tenantId, isReady } = useActiveTenant();
  const [loading, setLoading] = useState(true);
  const [chartReady, setChartReady] = useState(false);
  const [rows, setRows] = useState<ProductReconMetrics[]>([]);

  useEffect(() => {
    setChartReady(true);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchProductReconMetrics(tenantId);
      setRows(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load product metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady) load();
  }, [tenantId, isReady]);

  const handleExport = () => {
    const csv = exportProductMetricsCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reconflow-product-metrics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Product metrics exported');
  };

  const chartData = rows.slice(0, 10).map((r) => ({
    name: r.label.length > 14 ? `${r.label.slice(0, 12)}…` : r.label,
    matchRate: r.matchRate,
    leakage: r.leakage,
  }));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <Button variant="ghost" asChild className="mb-2 -ml-2">
              <Link href="/reports">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Reports
              </Link>
            </Button>
            <h1 className="text-4xl font-bold text-slate-900">Product Reconciliation</h1>
            <p className="text-muted-foreground mt-2">
              Phase 2 — per-product match rate, leakage, and unmatched aging
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={!rows.length}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={load} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Products tracked</p>
              <p className="text-4xl font-bold">{rows.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Avg match rate</p>
              <p className="text-4xl font-bold text-emerald-600">
                {rows.length
                  ? Math.round(
                      rows.reduce((s, r) => s + r.matchRate, 0) / rows.length * 10,
                    ) / 10
                  : 0}
                %
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Total leakage (unmatched)</p>
              <p className="text-4xl font-bold text-red-600">
                ₦{rows.reduce((s, r) => s + r.leakage, 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Match rate vs leakage by product</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-16">Loading chart…</p>
            ) : chartData.length && chartReady ? (
              <div className="w-full min-w-0 h-[320px]">
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="matchRate" fill="#10b981" name="Match %" />
                    <Bar yAxisId="right" dataKey="leakage" fill="#ef4444" name="Leakage ₦" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-16">No ledger data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Matched</TableHead>
                  <TableHead className="text-right">Unmatched</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-right">Match %</TableHead>
                  <TableHead className="text-right">Leakage ₦</TableHead>
                  <TableHead className="text-right">Avg age (days)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      Upload reports and run reconciliation to populate this view.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.product_type}>
                      <TableCell>
                        <span className="font-medium">{row.label}</span>
                        <p className="text-xs text-muted-foreground font-mono">{row.product_type}</p>
                      </TableCell>
                      <TableCell className="text-right">{row.total.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-emerald-700">
                        {row.matched.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-700">
                        {row.unmatched.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-amber-700">
                        {row.pending.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={row.matchRate >= 90 ? 'default' : row.matchRate >= 70 ? 'secondary' : 'destructive'}
                        >
                          {row.matchRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">₦{row.leakage.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{row.avgUnmatchedAgeDays}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}