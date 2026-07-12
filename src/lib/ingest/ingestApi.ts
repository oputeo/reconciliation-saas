import { supabase } from '@/lib/supabase';

export type IngestSchedule = {
  id: string;
  tenant_id: string;
  name: string;
  report_type: string;
  report_side: string;
  source_type: 'api' | 'sftp' | 'reconcile';
  frequency: 'hourly' | 'daily' | 'weekly';
  enabled: boolean;
  auto_reconcile: boolean;
  config: Record<string, unknown>;
  last_run_at: string | null;
  next_run_at: string;
};

export type IngestRun = {
  id: string;
  tenant_id: string;
  schedule_id: string | null;
  source_type: string;
  report_type: string | null;
  status: string;
  records_inserted: number;
  records_skipped: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
};

export type ReportCoverageRow = {
  report_type: string;
  upload_count: number;
  total_records: number;
};

export async function fetchIngestSchedules(tenantId: string): Promise<IngestSchedule[]> {
  const { data, error } = await supabase
    .from('ingest_schedules')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as IngestSchedule[];
}

export async function fetchRecentIngestRuns(tenantId: string, limit = 20): Promise<IngestRun[]> {
  const { data, error } = await supabase
    .from('ingest_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as IngestRun[];
}

export async function fetchReportCoverage(tenantId: string): Promise<ReportCoverageRow[]> {
  const { data, error } = await supabase
    .from('uploads')
    .select('report_type, records_count')
    .eq('tenant_id', tenantId);
  if (error) throw new Error(error.message);

  const grouped = new Map<string, { uploads: number; records: number }>();
  for (const row of data ?? []) {
    const key = row.report_type || 'generic';
    const bucket = grouped.get(key) ?? { uploads: 0, records: 0 };
    bucket.uploads++;
    bucket.records += Number(row.records_count ?? 0);
    grouped.set(key, bucket);
  }

  return [...grouped.entries()]
    .map(([report_type, stats]) => ({
      report_type,
      upload_count: stats.uploads,
      total_records: stats.records,
    }))
    .sort((a, b) => b.total_records - a.total_records);
}

export async function toggleIngestSchedule(
  scheduleId: string,
  enabled: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('ingest_schedules')
    .update({ enabled })
    .eq('id', scheduleId);
  if (error) throw new Error(error.message);
}

export async function createIngestApiKey(
  tenantId: string,
  label = 'default',
): Promise<{ api_key: string; prefix: string }> {
  const { data, error } = await supabase.rpc('create_tenant_ingest_key', {
    p_tenant_id: tenantId,
    p_label: label,
  });
  if (error) throw new Error(error.message);
  if (!data?.api_key) throw new Error('Failed to create API key');
  return { api_key: data.api_key, prefix: data.prefix };
}

export async function triggerScheduledIngest(tenantId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('run-scheduled-ingest', {
    body: { tenant_id: tenantId },
  });
  if (error) throw new Error(error.message);
}