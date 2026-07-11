'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import ReportUploadPanel from '@/components/uploads/ReportUploadPanel';
import { supabase } from '@/lib/supabase';
import { invokeTenantFunction } from '@/lib/edgeFunctions';
import { type BackAuditResult } from '@/lib/backAudit';
import { toast } from 'sonner';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import { useAuditPeriods } from '@/hooks/useAuditPeriods';

const tabs = [
  { id: "operations", label: "Operations Platform" },
  { id: "master-ledger", label: "Master Ledger" },
  { id: "recovery", label: "Revenue Recovery & Back Audit" },
];

export default function ReconciliationPage() {
  const { tenantId, isReady } = useActiveTenant();
  const {
    backAuditRange,
    backAuditPeriodLabel,
    backAuditYears,
    reconciliationYear,
    reconciliationPeriodLabel,
    loading: periodsLoading,
  } = useAuditPeriods();
  const [activeTab, setActiveTab] = useState<"operations" | "master-ledger" | "recovery">("operations");

  // Master Ledger States
  const [masterLedgerCount, setMasterLedgerCount] = useState(0);
  const [sourceLayers, setSourceLayers] = useState<{ source: string; count: number }[]>([]);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const [transactionsBySource, setTransactionsBySource] = useState<Record<string, any[]>>({});
  const [loadingTransactions, setLoadingTransactions] = useState<Record<string, boolean>>({});
  const [loadingMasterLedger, setLoadingMasterLedger] = useState(false);

  const [isReconciling, setIsReconciling] = useState(false);
  const [reconPeriod, setReconPeriod] = useState<'year' | 'biweekly' | 'custom'>('year');
  const [biweekPeriod, setBiweekPeriod] = useState('BW06-2026');
  const [customStart, setCustomStart] = useState('2026-07-01');
  const [customEnd, setCustomEnd] = useState('2026-07-14');

  // Back Audit
  const [isRunningBackAudit, setIsRunningBackAudit] = useState(false);
  const [backAuditStart, setBackAuditStart] = useState(backAuditRange.startDate);
  const [backAuditEnd, setBackAuditEnd] = useState(backAuditRange.endDate);
  const [backAuditProduct, setBackAuditProduct] = useState('all');

  useEffect(() => {
    if (!periodsLoading) {
      setBackAuditStart(backAuditRange.startDate);
      setBackAuditEnd(backAuditRange.endDate);
    }
  }, [periodsLoading, backAuditRange.startDate, backAuditRange.endDate]);

  const handleRunReconciliation = async () => {
    setIsReconciling(true);
    try {
      const body: Record<string, unknown> = { tenant_id: tenantId, year: reconciliationYear };
      if (reconPeriod === 'biweekly') {
        body.period = 'biweekly';
        body.biweek_period = biweekPeriod;
      } else if (reconPeriod === 'custom') {
        body.period = 'custom';
        body.start_date = customStart;
        body.end_date = customEnd;
      } else {
        body.period = 'year';
      }
      const { data, error } = await supabase.functions.invoke('run-reconciliation', {
        body,
      });
      if (error) throw error;
      const rate = data?.match_rate ?? 0;
      const matched = data?.matched ?? 0;
      const processed = data?.processed ?? 0;
      const feeFlags = data?.fee_assurance_flags ?? 0;
      toast.success(
        `Reconciliation complete: ${matched}/${processed} matched (${rate}%)` +
          (feeFlags ? ` · ${feeFlags} fee assurance flag(s)` : ''),
      );
      loadMasterLedger();
    } catch (err: any) {
      toast.error(err.message || "Reconciliation failed");
    } finally {
      setIsReconciling(false);
    }
  };

  // ==================== MASTER LEDGER ====================
  const loadMasterLedger = useCallback(async () => {
    setLoadingMasterLedger(true);
    try {
      const { count } = await supabase
        .from('master_ledger')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      setMasterLedgerCount(count || 0);

      const { data } = await supabase
        .from('master_ledger')
        .select('source')
        .eq('tenant_id', tenantId);

      const grouped = (data || []).reduce((acc: any, row: any) => {
        const src = row.source?.trim() || 'Unknown';
        acc[src] = (acc[src] || 0) + 1;
        return acc;
      }, {});

      const layers = Object.entries(grouped).map(([source, count]) => ({
        source: source as string,
        count: count as number
      })).sort((a, b) => b.count - a.count);

      setSourceLayers(layers);
    } catch (err) {
      toast.error("Failed to load Master Ledger");
    } finally {
      setLoadingMasterLedger(false);
    }
  }, [tenantId]);

  const toggleSource = async (source: string) => {
    const newSet = new Set(expandedSources);
    if (newSet.has(source)) {
      newSet.delete(source);
    } else {
      newSet.add(source);
      if (!transactionsBySource[source]) {
        const { data } = await supabase
          .from('master_ledger')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('source', source)
          .order('transaction_date', { ascending: false })
          .limit(50);
        setTransactionsBySource(prev => ({ ...prev, [source]: data || [] }));
      }
    }
    setExpandedSources(newSet);
  };

  const runBackAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReady) return toast.error('Workspace not ready');
    if (!backAuditStart || !backAuditEnd) return toast.error('Start and end dates are required');
    if (new Date(backAuditStart) > new Date(backAuditEnd)) {
      return toast.error('End date must be on or after start date');
    }
    setIsRunningBackAudit(true);
    try {
      const { data: result, error } = await invokeTenantFunction<BackAuditResult>('run-back-audit', {
        tenant_id: tenantId,
        start_date: backAuditStart,
        end_date: backAuditEnd,
        years_back: backAuditYears,
        product_type: backAuditProduct === 'all' ? null : backAuditProduct,
      }, tenantId);
      if (error) throw error;
      toast.success(result?.message ?? 'Back audit completed successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Back Audit failed');
    } finally {
      setIsRunningBackAudit(false);
    }
  };

  useEffect(() => {
    if (isReady) loadMasterLedger();
  }, [loadMasterLedger, isReady]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Moniepoint Reconciliation Platform</h1>
        <p className="text-muted-foreground mb-10">Smart Reconciliation • Product Audit • Revenue Recovery</p>

        {/* Tabs */}
        <div className="flex gap-3 mb-10 flex-wrap">
          {tabs.map(tab => (
            <Button 
              key={tab.id} 
              variant={activeTab === tab.id ? "default" : "outline"} 
              onClick={() => setActiveTab(tab.id as any)} 
              className="px-8 py-6 text-lg font-medium"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* ==================== OPERATIONS PLATFORM ==================== */}
        {activeTab === "operations" && (
          <div className="grid gap-8 overflow-visible">
            <ReportUploadPanel compact onSuccess={loadMasterLedger} />

            {/* Reconciliation Engine */}
            <Card>
              <CardHeader>
                <CardTitle>Reconciliation Engine</CardTitle>
                <p className="text-sm text-muted-foreground font-normal">
                  {reconciliationPeriodLabel} — operational matching for audit year {reconciliationYear}.
                </p>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <div className="grid gap-4 md:grid-cols-3 max-w-3xl mx-auto">
                  <div>
                    <Label>Period mode</Label>
                    <Select value={reconPeriod} onValueChange={(v) => setReconPeriod(v as typeof reconPeriod)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="year">Full audit year</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly (SmartDelta)</SelectItem>
                        <SelectItem value="custom">Custom date range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {reconPeriod === 'biweekly' && (
                    <div>
                      <Label>Bi-week period</Label>
                      <Input value={biweekPeriod} onChange={(e) => setBiweekPeriod(e.target.value)} placeholder="BW06-2026" />
                    </div>
                  )}
                  {reconPeriod === 'custom' && (
                    <>
                      <div>
                        <Label>Start date</Label>
                        <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                      </div>
                      <div>
                        <Label>End date</Label>
                        <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                      </div>
                    </>
                  )}
                </div>
                <div className="text-center">
                  <Button
                    onClick={handleRunReconciliation}
                    disabled={isReconciling}
                    size="lg"
                    className="text-xl px-16 py-10"
                  >
                    {isReconciling ? 'Running reconciliation…' : 'Run Reconciliation'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* MASTER LEDGER & RECOVERY TABS (unchanged) */}
        {activeTab === "master-ledger" && (
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Master Ledger - Single Source of Truth</CardTitle>
              <Button onClick={loadMasterLedger} variant="outline" disabled={loadingMasterLedger}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loadingMasterLedger ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="mb-6 text-xl">
                Total Records: <span className="font-bold text-blue-600">{masterLedgerCount.toLocaleString()}</span>
              </div>

              {sourceLayers.map((layer) => (
                <div key={layer.source} className="mb-4 border rounded-xl bg-white overflow-hidden">
                  <button onClick={() => toggleSource(layer.source)} className="w-full px-6 py-5 flex justify-between items-center hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      {expandedSources.has(layer.source) ? <ChevronDown /> : <ChevronRight />}
                      <span className="font-semibold capitalize">{layer.source}</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">{layer.count}</span>
                  </button>

                  {expandedSources.has(layer.source) && transactionsBySource[layer.source] && (
                    <div className="p-6 bg-slate-50 border-t">
                      <div className="max-h-80 overflow-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-white">
                              <th className="p-3 text-left">Transaction ID</th>
                              <th className="p-3 text-left">Product</th>
                              <th className="p-3 text-right">Amount</th>
                              <th className="p-3 text-left">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactionsBySource[layer.source].map((tx) => (
                              <tr key={tx.id} className="border-t hover:bg-white">
                                <td className="p-3 font-mono">{tx.transaction_id}</td>
                                <td className="p-3 capitalize">{tx.product_type}</td>
                                <td className="p-3 text-right">₦{Number(tx.amount).toLocaleString()}</td>
                                <td className="p-3">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {activeTab === "recovery" && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue Recovery & Back Audit</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Closed-period recovery: <span className="font-medium">{backAuditPeriodLabel}</span>
                {' '}(last {backAuditYears} full years before audit year {reconciliationYear}).
                Adjust periods in Settings → Reconciliation.
              </p>
              <form onSubmit={runBackAudit} className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8 bg-white border rounded-2xl">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={backAuditStart}
                    onChange={(e) => setBackAuditStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={backAuditEnd}
                    onChange={(e) => setBackAuditEnd(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Product Type</Label>
                  <Select value={backAuditProduct} onValueChange={setBackAuditProduct}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="ussd">USSD</SelectItem>
                      <SelectItem value="wallet">Wallet</SelectItem>
                      <SelectItem value="pos">POS</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full" disabled={isRunningBackAudit}>
                    {isRunningBackAudit ? "Running..." : "🚀 Run Back Audit"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}