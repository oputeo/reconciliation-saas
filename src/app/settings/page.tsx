'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, Users, Bell, Shield } from 'lucide-react';
import SettingsShell from '@/components/settings/SettingsShell';
import { SettingSection, StatCard } from '@/components/settings/SettingSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/app/providers';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import { supabase } from '@/lib/supabase';
import { ROLE_LABELS, normalizeRole, hasMinRole } from '@/lib/settings/permissions';

export default function SettingsOverviewPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { tenant, tenantId, loading: tenantLoading } = useTenantSettings();
  const role = normalizeRole(profile?.role);
  const signedInEmail = authLoading ? null : user?.email;

  const [stats, setStats] = useState({
    pendingInvites: 0,
    teamMembers: 0,
    activeRules: 0,
  });

  useEffect(() => {
    const load = async () => {
      const [invites, members, rules] = await Promise.all([
        supabase
          .from('access_requests')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('status', 'pending'),
        supabase
          .from('user_roles')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId),
        supabase
          .from('rules')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('is_active', true),
      ]);

      setStats({
        pendingInvites: invites.count ?? 0,
        teamMembers: members.count ?? 0,
        activeRules: rules.count ?? 0,
      });
    };

    if (tenantId) load();
  }, [tenantId]);

  const quickLinks = [
    {
      href: '/settings/organization',
      label: 'Organization profile',
      icon: Building2,
      show: hasMinRole(role, 'admin'),
    },
    {
      href: '/settings/tenants',
      label: 'Register workspaces',
      icon: Building2,
      show: hasMinRole(role, 'admin'),
    },
    {
      href: '/settings/users',
      label: 'Manage users & teams',
      icon: Users,
      show: hasMinRole(role, 'admin'),
    },
    {
      href: '/settings/notifications',
      label: 'Alert preferences',
      icon: Bell,
      show: hasMinRole(role, 'auditor'),
    },
    {
      href: '/settings/security',
      label: 'Security policies',
      icon: Shield,
      show: hasMinRole(role, 'admin'),
    },
  ].filter((l) => l.show);

  return (
    <SettingsShell
      title="Settings Overview"
      description="Manage your workspace configuration, team access, and reconciliation preferences."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Team members" value={stats.teamMembers} hint="Active users in this tenant" />
        <StatCard label="Pending invites" value={stats.pendingInvites} hint="Awaiting signup" />
        <StatCard label="Active rules" value={stats.activeRules} hint="Reconciliation rule engine" />
      </div>

      <SettingSection
        title="Workspace"
        description="Your current tenant context across ReconFlow."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <p className="text-slate-500">Organization</p>
            <p className="font-semibold text-slate-900 mt-1">
              {tenantLoading ? '—' : tenant?.name || '—'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <p className="text-slate-500">Plan</p>
            <p className="font-semibold text-slate-900 mt-1 capitalize">
              {tenantLoading ? '—' : tenant?.plan || 'professional'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <p className="text-slate-500">Timezone</p>
            <p className="font-semibold text-slate-900 mt-1">
              {tenantLoading ? '—' : tenant?.timezone || 'Africa/Lagos'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4 bg-white">
            <p className="text-slate-500">Signed in as</p>
            <p className="font-semibold text-slate-900 mt-1" suppressHydrationWarning>
              {signedInEmail || '—'}
            </p>
            <Badge variant="secondary" className="mt-2 capitalize">
              {authLoading ? '—' : ROLE_LABELS[role]}
            </Badge>
          </div>
        </div>
      </SettingSection>

      <SettingSection title="Quick actions" description="Jump to commonly used settings.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:border-emerald-300 hover:bg-emerald-50/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <link.icon className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-slate-800">{link.label}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          ))}
        </div>
      </SettingSection>

      {hasMinRole(role, 'admin') && (
        <SettingSection
          title="Admin playbook"
          description="Multi-tenant operations for this platform."
        >
          <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
            <li><strong>Register workspace</strong> → Settings → Workspaces → New workspace</li>
            <li><strong>Update tenant details</strong> → Settings → Organization → Save</li>
            <li><strong>Invite team</strong> → Settings → Users & Teams → Invite (copy link)</li>
            <li><strong>Assign roles</strong> → Users & Teams → change role dropdown</li>
            <li><strong>Configure rules</strong> → Settings → Reconciliation / Fee Engine</li>
          </ol>
        </SettingSection>
      )}
    </SettingsShell>
  );
}