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

export default function NotificationsSettingsPage() {
  const { tenant, saving, updateSettings, isAdmin } = useTenantSettings();
  const [form, setForm] = useState({
    email_alerts: true,
    anomaly_threshold: 85,
    daily_digest: false,
  });

  useEffect(() => {
    if (tenant?.settings?.notifications) {
      setForm(tenant.settings.notifications);
    }
  }, [tenant]);

  const handleSave = async () => {
    const { error } = await updateSettings({ notifications: form });
    if (error) toast.error(error);
    else toast.success('Notification preferences saved');
  };

  return (
    <SettingsShell
      title="Notifications"
      description="Control how your team is alerted to anomalies and daily reconciliation status."
      actions={
        <Button onClick={handleSave} disabled={saving || !isAdmin} className="accent-btn">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save
        </Button>
      }
    >
      <SettingSection title="Alert channels" description="Email notifications for this tenant workspace.">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
          <div>
            <p className="font-medium">Email alerts</p>
            <p className="text-sm text-slate-500">Send alerts for high-confidence anomalies</p>
          </div>
          <Switch
            checked={form.email_alerts}
            onCheckedChange={(v) => setForm({ ...form, email_alerts: v })}
            disabled={!isAdmin}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
          <div>
            <p className="font-medium">Daily digest</p>
            <p className="text-sm text-slate-500">Summary of reconciliation health each morning</p>
          </div>
          <Switch
            checked={form.daily_digest}
            onCheckedChange={(v) => setForm({ ...form, daily_digest: v })}
            disabled={!isAdmin}
          />
        </div>
      </SettingSection>

      <SettingSection title="Thresholds" description="When to escalate anomalies to the team.">
        <div className="space-y-2 max-w-xs">
          <Label>Anomaly confidence threshold (%)</Label>
          <Input
            type="number"
            min={50}
            max={100}
            value={form.anomaly_threshold}
            onChange={(e) =>
              setForm({ ...form, anomaly_threshold: parseInt(e.target.value, 10) || 85 })
            }
            disabled={!isAdmin}
          />
        </div>
      </SettingSection>
    </SettingsShell>
  );
}