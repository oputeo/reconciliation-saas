'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import SettingsShell from '@/components/settings/SettingsShell';
import { SettingSection } from '@/components/settings/SettingSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTenantSettings } from '@/hooks/useTenantSettings';

const TIMEZONES = [
  'Africa/Lagos',
  'Africa/Johannesburg',
  'Europe/London',
  'America/New_York',
  'UTC',
];

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR'];

export default function OrganizationSettingsPage() {
  const { tenant, loading, saving, updateTenant, isAdmin } = useTenantSettings();

  const [form, setForm] = useState({
    name: '',
    slug: '',
    billing_email: '',
    timezone: 'Africa/Lagos',
    currency: 'NGN',
    plan: 'professional',
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name,
        slug: tenant.slug || '',
        billing_email: tenant.billing_email || '',
        timezone: tenant.timezone,
        currency: tenant.currency,
        plan: tenant.plan,
      });
    }
  }, [tenant]);

  const handleSave = async () => {
    if (!isAdmin) {
      toast.error('Only administrators can update organization settings');
      return;
    }

    const { error } = await updateTenant({
      name: form.name.trim(),
      slug: form.slug.trim() || null,
      billing_email: form.billing_email.trim() || null,
      timezone: form.timezone,
      currency: form.currency,
      plan: form.plan,
    });

    if (error) toast.error(error);
    else toast.success('Organization settings saved');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading organization…
      </div>
    );
  }

  return (
    <SettingsShell
      title="Organization"
      description="Company profile and workspace defaults for your tenant."
      actions={
        <Button onClick={handleSave} disabled={saving || !isAdmin} className="accent-btn">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save changes
        </Button>
      }
    >
      <SettingSection
        title="Company profile"
        description="Displayed across reports, invites, and executive dashboards."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="name">Organization name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Workspace slug</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="oeo-solution"
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="billing_email">Billing contact email</Label>
            <Input
              id="billing_email"
              type="email"
              value={form.billing_email}
              onChange={(e) => setForm({ ...form, billing_email: e.target.value })}
              disabled={!isAdmin}
            />
          </div>
        </div>
      </SettingSection>

      <SettingSection title="Regional defaults" description="Used for settlement windows and report formatting.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select
              value={form.timezone}
              onValueChange={(v) => setForm({ ...form, timezone: v })}
              disabled={!isAdmin}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={form.currency}
              onValueChange={(v) => setForm({ ...form, currency: v })}
              disabled={!isAdmin}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingSection>

      <SettingSection title="Subscription" description="Current plan for this tenant workspace.">
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
          <div>
            <p className="font-semibold text-slate-900 capitalize">{form.plan} plan</p>
            <p className="text-sm text-slate-600">Multi-tenant reconciliation, forecasting, and audit modules</p>
          </div>
          <Button variant="outline" disabled>
            Manage billing
          </Button>
        </div>
      </SettingSection>
    </SettingsShell>
  );
}