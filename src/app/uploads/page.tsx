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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { RefreshCw, Trash2, RotateCcw, Eraser } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import { useAuth } from '@/app/providers';
import ReportUploadPanel, { type UploadPreset } from '@/components/uploads/ReportUploadPanel';
import { clearWorkspaceData, deleteUploadRun } from '@/lib/ingest/uploadApi';
import { type ReportSide, type ReportType } from '@/lib/reconciliation/reportTypes';
import { toast } from 'sonner';

type UploadHistoryRow = {
  id: string;
  filename: string;
  report_type: string;
  report_side?: string;
  status: string;
  created_at: string;
  records_count: number | null;
  error_message?: string | null;
  source: 'ingest_run' | 'upload';
};

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'completed') return 'default';
  if (status === 'failed') return 'destructive';
  if (status === 'rolled_back') return 'outline';
  return 'secondary';
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
    error_message: row.error_message ? String(row.error_message) : null,
    source: 'ingest_run',
  };
}

function rowFromUploadsTable(row: Record<string, unknown>): UploadHistoryRow | null {
  if (!row.ingest_run_id) {
    return {
      id: String(row.id),
      filename: String(row.file_name ?? row.filename ?? 'Unknown file'),
      report_type: String(row.report_type ?? 'generic'),
      report_side: row.report_side ? String(row.report_side) : undefined,
      status: String(row.status ?? 'completed'),
      created_at: String(row.created_at ?? new Date().toISOString()),
      records_count: null,
      error_message: row.error_message ? String(row.error_message) : null,
      source: 'upload',
    };
  }
  return null;
}

export default function UploadsPage() {
  const { tenantId, isReady, tenantName } = useActiveTenant();
  const { hasPermission } = useAuth();
  const isAdmin = hasPermission('admin');
  const canManageUploads = hasPermission('auditor');

  const [uploads, setUploads] = useState<UploadHistoryRow[]>([]);
  const [ledgerCount, setLedgerCount] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reuploadPreset, setReuploadPreset] = useState<UploadPreset | null>(null);

  const fetchUploads = useCallback(async () => {
    const [ingestRes, uploadsRes, ledgerRes] = await Promise.all([
      supabase
        .from('ingest_runs')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('source_type', 'upload')
        .order('started_at', { ascending: false })
        .limit(50),
      supabase
        .from('uploads')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('master_ledger')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId),
    ]);

    const ingest = (ingestRes.data ?? []).map((r) => rowFromIngestRun(r));
    const legacy = (uploadsRes.data ?? [])
      .map((r) => rowFromUploadsTable(r))
      .filter((r): r is UploadHistoryRow => r !== null);

    const byId = new Map<string, UploadHistoryRow>();
    for (const row of ingest) byId.set(row.id, row);
    for (const row of legacy) {
      if (!byId.has(row.id)) byId.set(row.id, row);
    }

    const merged = [...byId.values()].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    setUploads(merged.slice(0, 50));
    setLedgerCount(ledgerRes.count ?? 0);
  }, [tenantId]);

  useEffect(() => {
    if (isReady) fetchUploads();
  }, [isReady, fetchUploads]);

  const handleClearWorkspace = async () => {
    if (!tenantId) return;
    setClearing(true);
    try {
      const result = await clearWorkspaceData(tenantId);
      if (!result.success) throw new Error(result.error ?? 'Clear failed');
      toast.success(result.message ?? 'Workspace cleared');
      await fetchUploads();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Clear workspace failed');
    } finally {
      setClearing(false);
    }
  };

  const handleDeleteUpload = async (row: UploadHistoryRow) => {
    if (!tenantId || row.source !== 'ingest_run') {
      toast.error('This upload cannot be rolled back automatically. Use Clear workspace.');
      return;
    }
    setDeletingId(row.id);
    try {
      const result = await deleteUploadRun(tenantId, row.id);
      if (!result.success) throw new Error(result.error ?? 'Delete failed');
      toast.success(result.message ?? 'Upload removed');
      await fetchUploads();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Delete upload failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleReupload = (row: UploadHistoryRow) => {
    setReuploadPreset({
      reportType: row.report_type as ReportType,
      reportSide: (row.report_side as ReportSide) ?? 'internal',
      filenameHint: row.filename,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
              Master ledger: {ledgerCount.toLocaleString()} records
              {tenantName ? ` · ${tenantName}` : ''}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={fetchUploads}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50">
                  <Eraser className="mr-2 h-4 w-4" />
                  Clear workspace
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all demo data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes ledger rows, upload history, anomalies, and reconciliation runs for{' '}
                    <strong>{tenantName ?? 'this workspace'}</strong> only. Tenant settings and users are kept.
                    Use this before a fresh SmartDelta chunk upload sequence.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearWorkspace}
                    disabled={clearing}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {clearing ? 'Clearing…' : 'Clear workspace data'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,28rem)_1fr] lg:items-start">
        <ReportUploadPanel
          onSuccess={fetchUploads}
          preset={reuploadPreset}
          onPresetConsumed={() => setReuploadPreset(null)}
        />

        <section className="min-w-0 rounded-xl border bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Upload history</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Failed uploads are logged here. Delete a run to roll back its rows, then re-upload.
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
                  {canManageUploads && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canManageUploads ? 6 : 5}
                      className="py-12 text-center text-muted-foreground"
                    >
                      No uploads yet
                    </TableCell>
                  </TableRow>
                ) : (
                  uploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell className="max-w-[180px]">
                        <p className="truncate font-medium">{upload.filename}</p>
                        {upload.error_message && (
                          <p className="text-xs text-red-600 mt-1 line-clamp-2">{upload.error_message}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {upload.report_type}
                          {upload.report_side ? ` / ${upload.report_side}` : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(upload.status)} className="capitalize">
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
                      {canManageUploads && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Re-upload with same settings"
                              onClick={() => handleReupload(upload)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            {upload.source === 'ingest_run' && upload.status !== 'rolled_back' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete upload and rollback ledger rows"
                                disabled={deletingId === upload.id}
                                onClick={() => handleDeleteUpload(upload)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
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