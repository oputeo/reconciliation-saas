'use client';

import { useEffect, useState } from 'react';
import { Copy, Key, Loader2, Play, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import SettingsShell from '@/components/settings/SettingsShell';
import { SettingSection } from '@/components/settings/SettingSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import {
  createIngestApiKey,
  fetchIngestSchedules,
  toggleIngestSchedule,
  triggerScheduledIngest,
  type IngestSchedule,
} from '@/lib/ingest/ingestApi';

export default function IngestSettingsPage() {
  const { tenantId } = useActiveTenant();
  const { isAdmin } = useTenantSettings();
  const [schedules, setSchedules] = useState<IngestSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);
  const [running, setRunning] = useState(false);

  const load = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      setSchedules(await fetchIngestSchedules(tenantId));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tenantId]);

  const handleCreateKey = async () => {
    setCreatingKey(true);
    try {
      const result = await createIngestApiKey(tenantId);
      setNewKey(result.api_key);
      toast.success('API key created — copy it now, it won’t be shown again');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create key');
    } finally {
      setCreatingKey(false);
    }
  };

  const copyKey = () => {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    toast.success('Copied to clipboard');
  };

  const handleRunScheduler = async () => {
    setRunning(true);
    try {
      await triggerScheduledIngest(tenantId);
      toast.success('Due schedules processed');
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Scheduler failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <SettingsShell
      title="Ingest & Automation"
      description="API keys, scheduled reconciliation, and SFTP connector config (Phase 3)."
      actions={
        <Button variant="outline" onClick={handleRunScheduler} disabled={running}>
          {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
          Run due schedules
        </Button>
      }
    >
      <SettingSection
        title="API ingest key"
        description="For machine-to-machine POST /ingest-report without user JWT."
      >
        <div className="flex flex-wrap gap-3 items-end">
          <Button onClick={handleCreateKey} disabled={!isAdmin || creatingKey}>
            {creatingKey ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Key className="h-4 w-4 mr-2" />}
            Generate new key
          </Button>
          {newKey && (
            <div className="flex-1 min-w-[280px] flex gap-2">
              <Input readOnly value={newKey} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyKey}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Header: <code className="bg-slate-100 px-1 rounded">x-ingest-key: rfk_…</code> +{' '}
          <code className="bg-slate-100 px-1 rounded">tenant_id</code> in JSON body
        </p>
      </SettingSection>

      <SettingSection
        title="Schedules"
        description="Collective reconciliation runs on a timer. SFTP rows are scaffolded for connector setup."
      >
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : schedules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No schedules found. Apply <code>RUN_PHASE3.sql</code> in Supabase.
          </p>
        ) : (
          <div className="space-y-3">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3"
              >
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.source_type} · {s.frequency} · next{' '}
                    {new Date(s.next_run_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{s.report_type}</Badge>
                  <Switch
                    checked={s.enabled}
                    disabled={!isAdmin}
                    onCheckedChange={async (v) => {
                      await toggleIngestSchedule(s.id, v);
                      setSchedules((prev) =>
                        prev.map((row) => (row.id === s.id ? { ...row, enabled: v } : row)),
                      );
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <Button variant="ghost" size="sm" className="mt-2" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </SettingSection>

      <SettingSection title="Webhook events" description="Configure URL in Integrations settings.">
        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li><code>ingest.completed</code> — after API or manual upload</li>
          <li><code>reconciliation.completed</code> — after Run Reconciliation</li>
          <li><code>schedule.completed</code> — after scheduled job</li>
        </ul>
      </SettingSection>
    </SettingsShell>
  );
}