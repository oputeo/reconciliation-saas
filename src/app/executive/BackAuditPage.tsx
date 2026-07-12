'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { invokeTenantFunction } from '@/lib/edgeFunctions';
import { type BackAuditResult } from '@/lib/backAudit';
import { toast } from 'sonner';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import { useAuditPeriods } from '@/hooks/useAuditPeriods';

export default function BackAuditPage() {
  const { tenantId, isReady } = useActiveTenant();
  const { backAuditRange, backAuditPeriodLabel, backAuditYears } = useAuditPeriods();
  const startDate = backAuditRange.startDate;
  const endDate = backAuditRange.endDate;
  const [isRunning, setIsRunning] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);

  const runBackAudit = async () => {
    if (!isReady) return toast.error('Workspace not ready');
    setIsRunning(true);
    try {
      const { data, error } = await invokeTenantFunction<BackAuditResult>('run-back-audit', {
        tenant_id: tenantId,
        start_date: startDate,
        end_date: endDate,
        years_back: backAuditYears,
      }, tenantId);

      if (error) throw error;

      toast.success('Back audit completed', {
        description: data?.job_id
          ? `Job #${data.job_id} · ${data.discrepancies_found ?? 0} discrepancies`
          : data?.message,
      });
    } catch (err: unknown) {
      toast.error('Back audit failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Fetch existing jobs
  useEffect(() => {
    if (!isReady) return;

    const fetchJobs = async () => {
      const { data } = await supabase
        .from('back_audit_jobs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      setJobs(data || []);
    };

    fetchJobs();
  }, [tenantId, isReady]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Back Audit Engine</h1>
          <p className="text-muted-foreground">
            Closed periods {backAuditPeriodLabel}
          </p>
        </div>
        <Badge variant="outline" className="text-green-600">Production Mode</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Run New Back Audit</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runBackAudit} 
            disabled={isRunning}
            size="lg"
            className="w-full py-8 text-lg"
          >
            {isRunning ? (
              <><RefreshCw className="mr-3 h-5 w-5 animate-spin" /> Running Back Audit...</>
            ) : (
              <><PlayCircle className="mr-3 h-5 w-5" /> Start Back Audit Now</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Back Audit Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">No jobs yet. Run your first back audit above.</p>
          ) : (
            <div className="space-y-4">
              {jobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{job.start_date} → {job.end_date}</p>
                    <p className="text-sm text-muted-foreground">Job #{job.id}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={job.status === 'completed' ? "default" : "secondary"}>
                      {job.status}
                    </Badge>
                    {job.discrepancies_found > 0 && (
                      <p className="text-sm text-orange-600 mt-1">
                        {job.discrepancies_found} discrepancies found
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}