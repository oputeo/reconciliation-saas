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

export default function SecuritySettingsPage() {
  const { tenant, saving, updateSettings, isAdmin } = useTenantSettings();
  const [form, setForm] = useState({
    session_timeout_minutes: 480,
    require_email_verification: true,
    ip_allowlist_enabled: false,
  });

  useEffect(() => {
    if (tenant?.settings?.security) {
      setForm(tenant.settings.security);
    }
  }, [tenant]);

  const handleSave = async () => {
    const { error } = await updateSettings({ security: form });
    if (error) toast.error(error);
    else toast.success('Security policies saved');
  };

  return (
    <SettingsShell
      title="Security"
      description="Authentication policies and session controls for your organization."
      actions={
        <Button onClick={handleSave} disabled={saving || !isAdmin} className="accent-btn">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save
        </Button>
      }
    >
      <SettingSection title="Authentication" description="Controls aligned with Supabase Auth configuration.">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
          <div>
            <p className="font-medium">Require email verification</p>
            <p className="text-sm text-slate-500">Users must confirm email before first sign-in</p>
          </div>
          <Switch
            checked={form.require_email_verification}
            onCheckedChange={(v) => setForm({ ...form, require_email_verification: v })}
            disabled={!isAdmin}
          />
        </div>

        <div className="space-y-2 max-w-xs">
          <Label>Session timeout (minutes)</Label>
          <Input
            type="number"
            min={30}
            max={1440}
            value={form.session_timeout_minutes}
            onChange={(e) =>
              setForm({ ...form, session_timeout_minutes: parseInt(e.target.value, 10) || 480 })
            }
            disabled={!isAdmin}
          />
        </div>
      </SettingSection>

      <SettingSection title="Network access" description="Restrict workspace access to approved IP ranges.">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
          <div>
            <p className="font-medium">IP allowlist</p>
            <p className="text-sm text-slate-500">Enterprise feature — enforce approved office IPs</p>
          </div>
          <Switch
            checked={form.ip_allowlist_enabled}
            onCheckedChange={(v) => setForm({ ...form, ip_allowlist_enabled: v })}
            disabled={!isAdmin}
          />
        </div>
      </SettingSection>
    </SettingsShell>
  );
}