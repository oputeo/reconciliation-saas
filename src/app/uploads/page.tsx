'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import ReportUploadPanel from '@/components/uploads/ReportUploadPanel';

type UploadHistoryRow = {
  id: string;
  filename: string;
  report_type: string;
  report_side?: string;
  status: string;
  created_at: string;
  records_count: number | null;
};

function rowFromUploadsTable(row: Record<string, unknown>): UploadHistoryRow {
  return {
    id: String(row.id),
    filename: String(row.file_name ?? row.filename ?? 'Unknown file'),
    report_type: String(row.report_type ?? 'generic'),
    report_side: row.report_side ? String(row.report_side) : undefined,
    status: String(row.status ?? 'completed'),
    created_at: String(row.created_at ?? new Date().toISOString()),
    records_count: null,
  };
}

function rowFromIngestRun(row: Record<string, unknown>): UploadHistoryRow {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id),
    filename: String(meta.filename ?? row.report_type ?? 'CSV upload'),
    report_type: String(row.report_type ?? 'generic'),
    report_side: meta.report_side ? String(meta.report_side) : undefined,
    status: String(row.status ?? 'completed'),
    created_at: String(row.started_at ?? row.completed_at ?? new Date().toISOString()),
    records_count: Number(row.records_inserted ?? 0),
  };
}

export default function UploadsPage() {
  const { tenantId, isReady } = useActiveTenant();
  const [uploads, setUploads] = useState<UploadHistoryRow[]>([]);
  const [ledgerCount, setLedgerCount] = useState<number | null>(null);

  const fetchUploads = useCallback(async () => {
    const [uploadsRes, ingestRes, ledgerRes] = await Promise.all([
      supabase
        .from('uploads')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('ingest_runs')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('source_type', 'upload')
        .order('started_at', { ascending: false })
        .limit(50),
      supabase
        .from('master_ledger')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
    ]);

    const legacy = (uploadsRes.data ?? []).map((r) => rowFromUploadsTable(r));
    const ingest = (ingestRes.data ?? []).map((r) => rowFromIngestRun(r));

    const seen = new Set<string>();
    const merged: UploadHistoryRow[] = [];
    for (const row of [...ingest, ...legacy]) {
      const key = `${row.filename}|${row.created_at}|${row.records_count ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(row);
    }

    merged.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    setUploads(merged.slice(0, 50));
    setLedgerCount(ledgerRes.count ?? 0);
  }, [tenantId]);

  useEffect(() => {
    if (isReady) fetchUploads();
  }, [isReady, fetchUploads]);

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk upload</h1>
          <p className="mt-1 text-muted-foreground">
            Ingest report CSVs into the master ledger for collective reconciliation.
          </p>
          {ledgerCount !== null && (
            <p className="mt-2 text-sm font-medium text-foreground">
              Master ledger: {ledgerCount.toLocaleString()} records in this workspace
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchUploads}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,28rem)_1fr] lg:items-start">
        <ReportUploadPanel onSuccess={fetchUploads} />

        <section className="min-w-0 rounded-xl border bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Upload history</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Recent ingest runs for this workspace
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Report</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                      No uploads yet
                    </TableCell>
                  </TableRow>
                ) : (
                  uploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {upload.filename}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {upload.report_type}
                          {upload.report_side ? ` / ${upload.report_side}` : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={upload.status === 'completed' ? 'default' : 'secondary'}>
                          {upload.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                        {new Date(upload.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {upload.records_count != null
                          ? upload.records_count.toLocaleString()
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
}