'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, RefreshCw, Clock, CheckCircle, XCircle, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { invokeTenantFunction } from '@/lib/edgeFunctions';
import { type BackAuditResult } from '@/lib/backAudit';
import { toast } from 'sonner';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import { useAuditPeriods } from '@/hooks/useAuditPeriods';
const products = ["card", "ussd", "wallet", "pos", "bank_transfer"];

export default function BackAuditPage() {
  const { tenantId, isReady } = useActiveTenant();
  const { backAuditRange, backAuditPeriodLabel, backAuditYears, loading: periodsLoading } =
    useAuditPeriods();
  const [startDate, setStartDate] = useState(backAuditRange.startDate);
  const [endDate, setEndDate] = useState(backAuditRange.endDate);
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [minAmount, setMinAmount] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);

  const fetchJobs = useCallback(async () => {
    const { data } = await supabase
      .from('back_audit_jobs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    setJobs(data || []);
  }, [tenantId]);

  useEffect(() => {
    if (!periodsLoading) {
      setStartDate(backAuditRange.startDate);
      setEndDate(backAuditRange.endDate);
    }
  }, [periodsLoading, backAuditRange.startDate, backAuditRange.endDate]);

  // Realtime jobs
  useEffect(() => {
    if (!isReady) return;

    fetchJobs();

    const channel = supabase
      .channel('back-audit-jobs')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'back_audit_jobs' }, 
        () => fetchJobs()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tenantId, isReady, fetchJobs]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Job ID copied to clipboard");
  };

  const runBackAudit = async () => {
    if (!isReady) return toast.error('Workspace not ready');
    setIsSubmitting(true);

    try {
      const { data, error } = await invokeTenantFunction<BackAuditResult>('run-back-audit', {
        tenant_id: tenantId,
        start_date: startDate,
        end_date: endDate,
        years_back: backAuditYears,
        product_type: selectedProduct === 'all' ? null : selectedProduct,
        min_amount: minAmount || 0,
      }, tenantId);

      if (error) throw error;

      toast.success('Back audit completed', {
        description: data?.job_id
          ? `Job #${data.job_id} · ${data.discrepancies_found ?? 0} discrepancies`
          : data?.message,
      });
      fetchJobs();
    } catch (err: unknown) {
      toast.error('Back audit failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'running': return <Badge className="bg-blue-600 animate-pulse"><RefreshCw className="w-3 h-3 mr-1" />Running</Badge>;
      case 'failed': return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      default: return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold">Back Audit Engine</h1>
            <p className="text-muted-foreground">
              Closed periods {backAuditPeriodLabel} · job tracking
            </p>
          </div>
          <Badge variant="outline" className="text-green-600">Production Ready</Badge>
        </div>

        {/* New Job Form */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle>Start New Back Audit Job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date and filters same as before */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Product Type</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map(p => (
                      <SelectItem key={p} value={p}>{p.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Minimum Amount (₦)</Label>
                <Input type="number" value={minAmount} onChange={(e) => setMinAmount(Number(e.target.value))} />
              </div>
            </div>

            <Button 
              onClick={runBackAudit} 
              disabled={isSubmitting}
              size="lg" 
              className="w-full py-8 text-lg font-semibold"
            >
              {isSubmitting ? (
                <><RefreshCw className="mr-3 h-5 w-5 animate-spin" /> Submitting Job...</>
              ) : (
                <><PlayCircle className="mr-3 h-5 w-5" /> Start Background Audit Job</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Live Jobs with Job ID */}
        <Card>
          <CardHeader>
            <CardTitle>Active & Completed Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <p className="text-center py-16 text-muted-foreground">
                No jobs yet. Create your first back audit above.
              </p>
            ) : (
              <div className="space-y-5">
                {jobs.map((job) => (
                  <Card key={job.id} className="p-6 border-l-4 border-l-blue-600">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        {/* Job ID - Prominently displayed */}
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground">JOB ID</span>
                          <code 
                            className="bg-slate-100 px-3 py-1 rounded font-mono text-sm cursor-pointer hover:bg-slate-200 transition"
                            onClick={() => copyToClipboard(job.id.toString())}
                          >
                            #{job.id}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard(job.id.toString())}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <p className="font-medium">
                          {job.start_date} → {job.end_date}
                          {job.product_type && <span className="ml-2 text-sm text-muted-foreground">({job.product_type})</span>}
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        {getStatusBadge(job.status)}
                        
                        {job.discrepancies_found > 0 && (
                          <div className="text-right">
                            <p className="text-lg font-semibold text-orange-600">
                              {job.discrepancies_found}
                            </p>
                            <p className="text-xs text-muted-foreground">Discrepancies</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {job.error_message && (
                      <p className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded">
                        Error: {job.error_message}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}