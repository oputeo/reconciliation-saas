'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExternalLink, Loader2, Play, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import {
  fetchIngestSchedules,
  fetchRecentIngestRuns,
  fetchReportCoverage,
  toggleIngestSchedule,
  triggerScheduledIngest,
  type IngestRun,
  type IngestSchedule,
  type ReportCoverageRow,
} from '@/lib/ingest/ingestApi';

export default function IngestMonitoringPanel() {
  const { tenantId, isReady } = useActiveTenant();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<IngestSchedule[]>([]);
  const [runs, setRuns] = useState<IngestRun[]>([]);
  const [coverage, setCoverage] = useState<ReportCoverageRow[]>([]);
  const [running, setRunning] = useState(false);

  const load = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [s, r, c] = await Promise.all([
        fetchIngestSchedules(tenantId),
        fetchRecentIngestRuns(tenantId),
        fetchReportCoverage(tenantId),
      ]);
      setSchedules(s);
      setRuns(r);
      setCoverage(c);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load ingest metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady) load();
  }, [tenantId, isReady]);

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await toggleIngestSchedule(id, enabled);
      setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, enabled } : s)));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    try {
      await triggerScheduledIngest(tenantId);
      toast.success('Scheduled jobs processed');
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Scheduler failed');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const dueSoon = schedules.filter((s) => s.enabled).length;
  const failedRuns = runs.filter((r) => r.status === 'failed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3 items-center">
        <p className="text-sm text-muted-foreground">
          Phase 3 ingest monitoring — schedules, API runs, report coverage
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings/ingest">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ingest settings
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleRunNow} disabled={running}>
            <Play className="h-4 w-4 mr-2" />
            {running ? 'Running…' : 'Run due schedules'}
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Active schedules</p>
            <p className="text-4xl font-bold text-emerald-600">{dueSoon}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Report types ingested</p>
            <p className="text-4xl font-bold">{coverage.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Recent ingest runs</p>
            <p className="text-4xl font-bold">{runs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Failed runs (recent)</p>
            <p className="text-4xl font-bold text-red-600">{failedRuns}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ingest schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Next run</TableHead>
                <TableHead>Enabled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No schedules — run RUN_PHASE3.sql to seed defaults
                  </TableCell>
                </TableRow>
              ) : (
                schedules.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{s.source_type}</Badge>
                    </TableCell>
                    <TableCell>{s.frequency}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(s.next_run_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={s.enabled}
                        onCheckedChange={(v) => handleToggle(s.id, v)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report type</TableHead>
                  <TableHead className="text-right">Uploads</TableHead>
                  <TableHead className="text-right">Records</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coverage.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No uploads yet
                    </TableCell>
                  </TableRow>
                ) : (
                  coverage.map((c) => (
                    <TableRow key={c.report_type}>
                      <TableCell className="font-mono text-sm">{c.report_type}</TableCell>
                      <TableCell className="text-right">{c.upload_count}</TableCell>
                      <TableCell className="text-right">{c.total_records.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent ingest runs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Report</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No runs yet
                    </TableCell>
                  </TableRow>
                ) : (
                  runs.slice(0, 10).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">
                        {new Date(r.started_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.report_type ?? '—'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === 'completed'
                              ? 'default'
                              : r.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{r.records_inserted}</TableCell>
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