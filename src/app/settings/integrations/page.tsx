'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import SettingsShell from '@/components/settings/SettingsShell';
import { SettingSection } from '@/components/settings/SettingSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useTenantSettings } from '@/hooks/useTenantSettings';

export default function IntegrationsSettingsPage() {
  const { tenant, saving, updateSettings, isAdmin } = useTenantSettings();
  const [form, setForm] = useState({
    power_bi_enabled: false,
    webhook_url: '',
  });

  useEffect(() => {
    if (tenant?.settings?.integrations) {
      setForm({
        power_bi_enabled: tenant.settings.integrations.power_bi_enabled,
        webhook_url: tenant.settings.integrations.webhook_url || '',
      });
    }
  }, [tenant]);

  const handleSave = async () => {
    const { error } = await updateSettings({
      integrations: {
        power_bi_enabled: form.power_bi_enabled,
        webhook_url: form.webhook_url.trim() || null,
      },
    });
    if (error) toast.error(error);
    else toast.success('Integration settings saved');
  };

  return (
    <SettingsShell
      title="Integrations"
      description="Connect external systems to your reconciliation workspace."
      actions={
        <Button onClick={handleSave} disabled={saving || !isAdmin} className="accent-btn">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save
        </Button>
      }
    >
      <SettingSection title="Power BI" description="Export executive dashboards to Power BI datasets.">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
          <div>
            <p className="font-medium">Enable Power BI connector</p>
            <p className="text-sm text-slate-500">Push reconciliation KPIs to your BI workspace</p>
          </div>
          <Switch
            checked={form.power_bi_enabled}
            onCheckedChange={(v) => setForm({ ...form, power_bi_enabled: v })}
            disabled={!isAdmin}
          />
        </div>
      </SettingSection>

      <SettingSection title="Webhooks" description="Receive event payloads for anomalies and job completion.">
        <div className="space-y-2">
          <Label>Webhook URL</Label>
          <Input
            type="url"
            placeholder="https://your-service.com/webhooks/reconflow"
            value={form.webhook_url}
            onChange={(e) => setForm({ ...form, webhook_url: e.target.value })}
            disabled={!isAdmin}
          />
        </div>
      </SettingSection>
    </SettingsShell>
  );
}