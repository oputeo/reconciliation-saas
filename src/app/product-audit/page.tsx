'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Download, RefreshCw, Filter, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import { aggregateProductAudit, isFlaggedLedgerRow } from '@/lib/reports/productAudit';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ProductAuditDashboard() {
  const { tenantId, isReady } = useActiveTenant();
  const [products, setProducts] = useState<any[]>([]);
  const [flaggedTransactions, setFlaggedTransactions] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [filters, setFilters] = useState({
    product_type: "all",
    start_date: "",
    end_date: "",
  });

  // Fetch Product Summary
  const fetchProductAuditData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('master_ledger')
        .select('product_type, transaction_id, amount, audit_flag, audit_score, match_score, status, review_status, transaction_date')
        .eq('tenant_id', tenantId)
        .in('status', ['pending', 'matched', 'unmatched']);

      if (filters.product_type !== "all") query = query.eq('product_type', filters.product_type);
      if (filters.start_date) query = query.gte('transaction_date', filters.start_date);
      if (filters.end_date) query = query.lte('transaction_date', filters.end_date);

      const { data, error } = await query;
      if (error) throw error;

      const result = aggregateProductAudit(data ?? []).map((p) => ({
        product: p.product_type,
        total_txns: p.total_txns,
        total_value: p.total_value,
        flagged: p.flagged,
        flagged_percent: p.flagged_percent.toFixed(2),
        avg_audit_score: p.avg_audit_score.toFixed(2),
        risk: p.risk,
      }));

      setProducts(result);
    } catch (err: any) {
      toast.error("Failed to load data", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Drill-down: Show flagged transactions
  const showFlaggedTransactions = async (product: string) => {
    setSelectedProduct(product);
    setDetailLoading(true);

    try {
      const { data, error } = await supabase
        .from('master_ledger')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('product_type', product)
        .or('audit_flag.eq.true,status.eq.unmatched')
        .order('transaction_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setFlaggedTransactions(data || []);
    } catch (err: any) {
      toast.error("Failed to load flagged transactions");
    } finally {
      setDetailLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (products.length === 0) return;

    const headers = ["Product", "Total Txns", "Total Value", "Flagged", "Flagged %", "Avg Audit Score"];
    const rows = products.map(p => [
      p.product,
      p.total_txns,
      p.total_value,
      p.flagged,
      p.flagged_percent,
      p.avg_audit_score
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `product_audit_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success("CSV exported successfully");
  };

  useEffect(() => {
    if (isReady) fetchProductAuditData();
  }, [filters, tenantId, isReady]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Product Audit Dashboard</h1>
            <p className="text-muted-foreground">Real-time Product Reconciliation & Risk Analysis</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchProductAuditData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label>Product Type</label>
              <Select value={filters.product_type} onValueChange={(v) => setFilters({ ...filters, product_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                  <SelectItem value="ussd">USSD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label>Start Date</label>
              <Input type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
            </div>
            <div>
              <label>End Date</label>
              <Input type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        {/* Main Summary Table */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle>Product Audit Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4 text-left">Product</th>
                    <th className="p-4 text-right">Total Txns</th>
                    <th className="p-4 text-right">Total Value</th>
                    <th className="p-4 text-right">Flagged</th>
                    <th className="p-4 text-right">Flagged %</th>
                    <th className="p-4 text-right">Avg Audit Score</th>
                    <th className="p-4 text-center">Priority</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={i} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => showFlaggedTransactions(p.product)}>
                      <td className="p-4 font-medium capitalize">{p.product}</td>
                      <td className="p-4 text-right">{p.total_txns}</td>
                      <td className="p-4 text-right">₦{Number(p.total_value).toLocaleString()}</td>
                      <td className="p-4 text-right text-orange-600 font-semibold">{p.flagged}</td>
                      <td className="p-4 text-right">{p.flagged_percent}%</td>
                      <td className="p-4 text-right font-medium">{p.avg_audit_score}</td>
                      <td className="p-4 text-center">
                        <Badge variant={Number(p.avg_audit_score) > 15 ? "destructive" : Number(p.avg_audit_score) > 12 ? "secondary" : "default"}>
                          {Number(p.avg_audit_score) > 15 ? "High" : Number(p.avg_audit_score) > 12 ? "Medium" : "Low"}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <Eye className="h-4 w-4 mx-auto text-blue-600" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader><CardTitle>Flagged Transactions by Product</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={products}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="flagged" fill="#ef4444" />
                  <Bar dataKey="total_txns" fill="#94a3b8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Value Distribution by Product</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie data={products} cx="50%" cy="50%" outerRadius={130} dataKey="total_value" nameKey="product">
                    {products.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₦${Number(value ?? 0).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Flagged Transactions Detail Modal */}
        {selectedProduct && (
          <Card className="mt-10">
            <CardHeader>
              <CardTitle>Flagged Transactions — {selectedProduct}</CardTitle>
              <Button variant="outline" onClick={() => setSelectedProduct(null)}>Close</Button>
            </CardHeader>
            <CardContent>
              {detailLoading ? (
                <p>Loading flagged transactions...</p>
              ) : flaggedTransactions.length === 0 ? (
                <p>No flagged transactions found for this product.</p>
              ) : (
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="p-3 text-left">Date</th>
                        <th className="p-3 text-left">Reference</th>
                        <th className="p-3 text-right">Amount</th>
                        <th className="p-3 text-left">Audit Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flaggedTransactions.map((tx, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-3">{tx.transaction_date}</td>
                          <td className="p-3 font-mono">{tx.reference}</td>
                          <td className="p-3 text-right">₦{Number(tx.amount).toLocaleString()}</td>
                          <td className="p-3">{tx.audit_score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}