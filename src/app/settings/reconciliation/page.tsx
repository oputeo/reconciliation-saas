'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import SettingsShell from '@/components/settings/SettingsShell';
import { SettingSection } from '@/components/settings/SettingSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import {
  formatBackAuditPeriodLabel,
  formatReconciliationPeriodLabel,
  getCurrentReconciliationRange,
  getDefaultBackAuditRange,
  resolveAuditPeriodConfig,
} from '@/lib/backAudit';

export default function ReconciliationSettingsPage() {
  const { tenant, saving, updateSettings, isAdmin } = useTenantSettings();
  const [form, setForm] = useState({
    default_tolerance: 2.0,
    auto_resolve_low_risk: false,
    default_channel: 'ALL',
    fuzzy_tolerance_ngn: 50,
    high_value_threshold_ngn: 500_000,
    current_audit_year: new Date().getFullYear(),
    back_audit_years: 10,
  });

  const periodConfig = resolveAuditPeriodConfig(form);
  const reconciliationPreview = formatReconciliationPeriodLabel(
    getCurrentReconciliationRange(periodConfig),
  );
  const backAuditPreview = formatBackAuditPeriodLabel(
    getDefaultBackAuditRange(periodConfig),
  );

  useEffect(() => {
    if (tenant?.settings?.reconciliation) {
      setForm(tenant.settings.reconciliation);
    }
  }, [tenant]);

  const handleSave = async () => {
    const { error } = await updateSettings({ reconciliation: form });
    if (error) toast.error(error);
    else toast.success('Reconciliation defaults saved');
  };

  return (
    <SettingsShell
      title="Reconciliation"
      description="Tenant-wide defaults for matching tolerance and automation."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/settings/rules">
              <ExternalLink className="h-4 w-4 mr-2" />
              Rule engine
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={saving || !isAdmin} className="accent-btn">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save
          </Button>
        </div>
      }
    >
      <SettingSection
        title="Audit periods"
        description="Set the current operational year once — back audit automatically covers the preceding closed years."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Current audit year</Label>
            <Input
              type="number"
              min={2000}
              max={2100}
              value={form.current_audit_year}
              onChange={(e) =>
                setForm({
                  ...form,
                  current_audit_year: parseInt(e.target.value, 10) || new Date().getFullYear(),
                })
              }
              disabled={!isAdmin}
            />
            <p className="text-xs text-slate-500">
              Run Reconciliation uses {form.current_audit_year}-01-01 → {form.current_audit_year}-12-31
            </p>
          </div>
          <div className="space-y-2">
            <Label>Back audit lookback (years)</Label>
            <Input
              type="number"
              min={1}
              max={30}
              value={form.back_audit_years}
              onChange={(e) =>
                setForm({
                  ...form,
                  back_audit_years: Math.min(30, Math.max(1, parseInt(e.target.value, 10) || 10)),
                })
              }
              disabled={!isAdmin}
            />
            <p className="text-xs text-slate-500">Closed periods before the current audit year</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm space-y-1">
          <p><span className="font-medium">Reconciliation:</span> {reconciliationPreview}</p>
          <p><span className="font-medium">Back audit:</span> {backAuditPreview}</p>
        </div>
      </SettingSection>

      <SettingSection
        title="Matching defaults"
        description="Applied when new reconciliation jobs are created for this tenant."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Default tolerance (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={form.default_tolerance}
              onChange={(e) =>
                setForm({ ...form, default_tolerance: parseFloat(e.target.value) || 0 })
              }
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-2">
            <Label>Fuzzy amount tolerance (₦)</Label>
            <Input
              type="number"
              value={form.fuzzy_tolerance_ngn}
              onChange={(e) =>
                setForm({ ...form, fuzzy_tolerance_ngn: parseInt(e.target.value, 10) || 0 })
              }
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-2">
            <Label>High-value threshold (₦)</Label>
            <Input
              type="number"
              value={form.high_value_threshold_ngn}
              onChange={(e) =>
                setForm({ ...form, high_value_threshold_ngn: parseInt(e.target.value, 10) || 0 })
              }
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-2">
            <Label>Default channel</Label>
            <Select
              value={form.default_channel}
              onValueChange={(v) => setForm({ ...form, default_channel: v })}
              disabled={!isAdmin}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['ALL', 'POS', 'Bank Transfer', 'Gateway', 'Transfer'].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
          <div>
            <p className="font-medium text-slate-900">Auto-resolve low-risk variances</p>
            <p className="text-sm text-slate-500">Automatically close items below tolerance threshold</p>
          </div>
          <Switch
            checked={form.auto_resolve_low_risk}
            onCheckedChange={(v) => setForm({ ...form, auto_resolve_low_risk: v })}
            disabled={!isAdmin}
          />
        </div>
      </SettingSection>
    </SettingsShell>
  );
}