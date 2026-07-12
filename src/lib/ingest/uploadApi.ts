import { invokeTenantFunction } from '@/lib/edgeFunctions';

export type UploadActionResult = {
  success: boolean;
  message?: string;
  error?: string;
  ledger_removed?: number;
  cleared?: Record<string, number>;
};

export async function clearWorkspaceData(tenantId: string): Promise<UploadActionResult> {
  const { data, error } = await invokeTenantFunction<UploadActionResult>(
    'clear-workspace',
    { tenant_id: tenantId, confirm: 'CLEAR' },
    tenantId,
  );
  if (error) return { success: false, error: error.message };
  return data ?? { success: true };
}

export async function deleteUploadRun(
  tenantId: string,
  ingestRunId: string,
): Promise<UploadActionResult> {
  const { data, error } = await invokeTenantFunction<UploadActionResult>(
    'delete-upload',
    { tenant_id: tenantId, ingest_run_id: ingestRunId },
    tenantId,
  );
  if (error) return { success: false, error: error.message };
  return data ?? { success: true };
}

export type UploadErrorKind = 'parse' | 'duplicate' | 'network' | 'unknown';

export function classifyUploadError(message: string): UploadErrorKind {
  const lower = message.toLowerCase();
  if (lower.includes('duplicate') || lower.includes('already exist')) return 'duplicate';
  if (
    lower.includes('column') ||
    lower.includes('csv') ||
    lower.includes('parse') ||
    lower.includes('required') ||
    lower.includes('invalid')
  ) {
    return 'parse';
  }
  if (lower.includes('network') || lower.includes('fetch')) return 'network';
  return 'unknown';
}

export function uploadErrorGuidance(kind: UploadErrorKind): string {
  switch (kind) {
    case 'parse':
      return 'Fix the CSV headers or row format, then re-upload the same file.';
    case 'duplicate':
      return 'Delete this upload from history (or clear workspace), then re-upload.';
    case 'network':
      return 'Check your connection and try again.';
    default:
      return 'Review the error, delete the failed upload if listed, then re-upload.';
  }
}