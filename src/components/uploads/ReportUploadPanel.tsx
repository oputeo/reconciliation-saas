'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ExpandableOptionPicker } from '@/components/ui/expandable-option-picker';
import { Upload, AlertTriangle } from 'lucide-react';
import { invokeUploadFunction } from '@/lib/edgeFunctions';
import {
  classifyUploadError,
  uploadErrorGuidance,
} from '@/lib/ingest/uploadApi';
import { toast } from 'sonner';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import {
  REPORT_TYPES,
  resolveReportSide,
  type ReportSide,
  type ReportType,
} from '@/lib/reconciliation/reportTypes';

const SIDE_LABELS: Record<ReportSide, string> = {
  internal: 'Internal — pending collections',
  settlement: 'Settlement — bank / pool',
  assurance: 'Assurance — fee benchmark',
  exception: 'Exception — chargebacks',
};

export type UploadPreset = {
  reportType?: ReportType;
  reportSide?: ReportSide;
  filenameHint?: string;
};

type Props = {
  onSuccess?: () => void;
  compact?: boolean;
  preset?: UploadPreset | null;
  onPresetConsumed?: () => void;
};

export default function ReportUploadPanel({
  onSuccess,
  compact,
  preset,
  onPresetConsumed,
}: Props) {
  const { tenantId, isReady } = useActiveTenant();
  const [reportType, setReportType] = useState<ReportType>('generic');
  const [reportSide, setReportSide] = useState<ReportSide>('internal');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reportTypeOpen, setReportTypeOpen] = useState(false);
  const [reportSideOpen, setReportSideOpen] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (!preset) return;
    if (preset.reportType) setReportType(preset.reportType);
    if (preset.reportSide) setReportSide(preset.reportSide);
    setLastError(null);
    onPresetConsumed?.();
  }, [preset, onPresetConsumed]);

  const selected = useMemo(
    () => REPORT_TYPES.find((r) => r.id === reportType) ?? REPORT_TYPES[0],
    [reportType],
  );

  const effectiveSide = resolveReportSide(reportType, reportSide);
  const sideIsLocked = selected.allowedSides.length === 1;
  const phase1 = REPORT_TYPES.filter((r) => r.phase === 1);
  const phase2 = REPORT_TYPES.filter((r) => r.phase === 2);
  const errorKind = lastError ? classifyUploadError(lastError) : null;

  const onTypeChange = (value: ReportType) => {
    setReportType(value);
    const option = REPORT_TYPES.find((r) => r.id === value);
    if (option) setReportSide(option.defaultSide);
  };

  const handleUpload = async () => {
    if (!isReady || !tenantId) return toast.error('Workspace not ready');
    if (!file) return toast.error('Select a CSV file first');

    setUploading(true);
    setLastError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tenant_id', tenantId);
    formData.append('report_type', reportType);
    formData.append('report_side', effectiveSide);

    try {
      const { data, error } = await invokeUploadFunction<{
        success?: boolean;
        error?: string;
        message?: string;
        inserted?: number;
      }>('process-upload', formData, tenantId);
      if (error) throw error;

      toast.success(data?.message ?? `Inserted ${data?.inserted ?? 0} rows`);
      setFile(null);
      onSuccess?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setLastError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={
        compact
          ? 'rounded-xl border bg-card p-5 space-y-5'
          : 'rounded-xl border bg-white p-6 sm:p-8 space-y-8 shadow-sm'
      }
    >
      <div className="space-y-1">
        <h2 className={compact ? 'text-lg font-semibold' : 'text-xl font-semibold'}>
          Upload report
        </h2>
        {!compact && (
          <p className="text-sm text-muted-foreground">
            Ingest report CSVs into the master ledger, then run collective reconciliation.
          </p>
        )}
      </div>

      {lastError && (
        <div className="max-w-xl rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm space-y-2">
          <div className="flex items-start gap-2 text-amber-950">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Upload failed</p>
              <p className="mt-1 text-amber-900">{lastError}</p>
              {errorKind && (
                <p className="mt-2 text-amber-800">{uploadErrorGuidance(errorKind)}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {preset?.filenameHint && (
        <p className="text-sm text-emerald-700 font-medium max-w-xl">
          Re-upload ready — use the same file: {preset.filenameHint}
        </p>
      )}

      <div className="space-y-6 max-w-xl">
        <div className="space-y-2">
          <Label htmlFor="report-type">Report type</Label>
          <ExpandableOptionPicker
            id="report-type"
            label="Report type"
            value={reportType}
            open={reportTypeOpen}
            onOpenChange={(open) => {
              setReportTypeOpen(open);
              if (open) setReportSideOpen(false);
            }}
            onChange={(v) => onTypeChange(v as ReportType)}
            placeholder="Choose report type"
            maxListHeight="max-h-80"
            groups={[
              {
                label: 'Phase 1',
                options: phase1.map((opt) => ({
                  value: opt.id,
                  label: opt.label,
                  description: opt.description,
                })),
              },
              {
                label: 'Phase 2',
                options: phase2.map((opt) => ({
                  value: opt.id,
                  label: opt.label,
                  description: opt.description,
                })),
              },
            ]}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="report-side">Ledger side</Label>
          {sideIsLocked ? (
            <div className="flex min-h-10 items-center rounded-md border bg-muted/40 px-3 py-2">
              <Badge variant="secondary">{SIDE_LABELS[effectiveSide]}</Badge>
            </div>
          ) : (
            <ExpandableOptionPicker
              id="report-side"
              label="Ledger side"
              value={effectiveSide}
              open={reportSideOpen}
              onOpenChange={(open) => {
                setReportSideOpen(open);
                if (open) setReportTypeOpen(false);
              }}
              onChange={(v) => setReportSide(v as ReportSide)}
              options={selected.allowedSides.map((side) => ({
                value: side,
                label: SIDE_LABELS[side],
              }))}
            />
          )}
        </div>
      </div>

      <div className="max-w-xl rounded-lg border bg-muted/30 p-4 space-y-3 text-sm">
        <p className="font-medium">{selected.label}</p>
        <p className="text-muted-foreground leading-relaxed">{selected.description}</p>
        <div className="pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-1">Expected columns</p>
          <p className="font-mono text-xs leading-relaxed break-all">
            {selected.expectedColumns.join(', ')}
          </p>
        </div>
      </div>

      <div className="max-w-xl space-y-4 pt-2 border-t">
        <div className="space-y-2">
          <Label htmlFor="report-file">CSV file</Label>
          <input
            id="report-file"
            type="file"
            accept=".csv"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <p className="text-xs text-muted-foreground">{file ? file.name : 'No file chosen'}</p>
        </div>
        <Button
          onClick={handleUpload}
          disabled={uploading || !file}
          className="w-full sm:w-auto min-w-[180px]"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Processing…' : 'Upload & map'}
        </Button>
      </div>
    </div>
  );
}