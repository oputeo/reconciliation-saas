'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import SettingsShell from '@/components/settings/SettingsShell';
import { SettingSection } from '@/components/settings/SettingSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { callAdminApi, setActiveTenantId } from '@/lib/settings/adminApi';

interface Workspace {
  id: string;
  name: string;
  plan: string;
  role: string;
}

export default function TenantsSettingsPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    billing_email: '',
    timezone: 'Africa/Lagos',
    currency: 'NGN',
  });

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const data = await callAdminApi({ action: 'list_my_tenants' });
      setWorkspaces(data.tenants || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error('Organization name is required');
    setCreating(true);
    try {
      const data = await callAdminApi({
        action: 'create_tenant',
        name: form.name.trim(),
        slug: form.slug.trim() || form.name.trim().toLowerCase().replace(/\s+/g, '-'),
        billing_email: form.billing_email.trim(),
        timezone: form.timezone,
        currency: form.currency,
      });

      toast.success(data.message || 'Workspace created');
      if (data.tenant?.id) {
        setActiveTenantId(data.tenant.id);
      }
      setForm({ name: '', slug: '', billing_email: '', timezone: 'Africa/Lagos', currency: 'NGN' });
      setShowForm(false);
      await loadWorkspaces();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create workspace');
    } finally {
      setCreating(false);
    }
  };

  return (
    <SettingsShell
      title="Workspaces"
      description="Register and manage multiple tenant organizations. Each workspace has isolated teams and settings."
      actions={
        <Button className="accent-btn" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          New workspace
        </Button>
      }
    >
      {showForm && (
        <SettingSection
          title="Register new tenant"
          description="Creates a new organization workspace and assigns you as administrator."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Organization name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Acme Finance Ltd"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="acme-finance"
              />
            </div>
            <div className="space-y-2">
              <Label>Billing email</Label>
              <Input
                type="email"
                value={form.billing_email}
                onChange={(e) => setForm({ ...form, billing_email: e.target.value })}
                placeholder="billing@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['NGN', 'USD', 'GBP', 'EUR'].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleCreate} disabled={creating} className="accent-btn">
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create workspace
          </Button>
        </SettingSection>
      )}

      <SettingSection title="Your workspaces" description="Switch workspace using the dropdown above.">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Your role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaces.map((ws) => (
                <TableRow key={ws.id}>
                  <TableCell className="font-medium">{ws.name}</TableCell>
                  <TableCell className="capitalize">{ws.plan}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">{ws.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveTenantId(ws.id);
                        window.location.reload();
                      }}
                    >
                      Switch to this workspace
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SettingSection>
    </SettingsShell>
  );
}