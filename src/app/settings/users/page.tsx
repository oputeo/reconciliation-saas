'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import SettingsShell from '@/components/settings/SettingsShell';
import { SettingSection } from '@/components/settings/SettingSection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { callAdminApi } from '@/lib/settings/adminApi';
import { ROLE_LABELS, AppRole } from '@/lib/settings/permissions';

interface TeamMember {
  user_id: string;
  role: string;
  created_at: string;
  email: string | null;
  full_name: string | null;
}

interface PendingInvite {
  id: string;
  email: string;
  full_name: string;
  role: string;
  requested_at: string;
  signup_url?: string;
}

const ROLES: AppRole[] = ['viewer', 'auditor', 'approver', 'admin'];

export default function UsersSettingsPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('viewer');
  const [inviteName, setInviteName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teamData, pendingData] = await Promise.all([
        callAdminApi({ action: 'list_team' }),
        callAdminApi({ action: 'list_pending' }),
      ]);
      setMembers(teamData.team || []);
      setPending(pendingData.requests || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load team');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return toast.error('Email is required');

    setInviting(true);
    try {
      const data = await callAdminApi({
        action: 'invite',
        email,
        role: inviteRole,
        full_name: inviteName.trim() || email.split('@')[0],
      });

      if (data.signup_url) {
        await navigator.clipboard.writeText(data.signup_url);
        toast.success('Invite saved — signup link copied');
      } else {
        toast.success(data.message || 'Invite saved');
      }

      setInviteEmail('');
      setInviteName('');
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    setUpdatingId(userId);
    try {
      await callAdminApi({ action: 'update_member_role', user_id: userId, role: newRole });
      toast.success('Role updated');
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const copyLink = async (inv: PendingInvite) => {
    const url = inv.signup_url || `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/accept-invite?email=${encodeURIComponent(inv.email)}`;
    await navigator.clipboard.writeText(url);
    toast.success('Link copied');
  };

  const cancelInvite = async (id: string) => {
    try {
      await callAdminApi({ action: 'cancel', request_id: id });
      toast.success('Invite cancelled');
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Cancel failed');
    }
  };

  return (
    <SettingsShell
      title="Users & Teams"
      description="Invite colleagues, assign roles, and manage access for the active workspace."
    >
      <SettingSection title="Invite team member" description="Saves invite and copies signup link to share.">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-2 md:col-span-1">
            <Label>Full name</Label>
            <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label>Email *</Label>
            <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="jane@company.com" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleInvite} disabled={inviting} className="accent-btn w-full">
              {inviting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Invite
            </Button>
          </div>
        </div>
      </SettingSection>

      <SettingSection title="Active team" description="Members with roles in this workspace. Data access is scoped by tenant.">
        {loading ? (
          <p className="text-sm text-slate-500">Loading team…</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-slate-500">No team members yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.user_id}>
                  <TableCell>{m.full_name || '—'}</TableCell>
                  <TableCell>{m.email || m.user_id.slice(0, 8) + '…'}</TableCell>
                  <TableCell>
                    <Select
                      value={m.role}
                      onValueChange={(v) => handleRoleChange(m.user_id, v as AppRole)}
                      disabled={updatingId === m.user_id}
                    >
                      <SelectTrigger className="w-40 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(m.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SettingSection>

      <SettingSection title="Pending invitations" description="Users who haven't completed signup yet.">
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500">No pending invites.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.full_name}</TableCell>
                  <TableCell>{inv.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ROLE_LABELS[inv.role] || inv.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => copyLink(inv)}>
                      <Copy className="h-3 w-3 mr-1" /> Link
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => cancelInvite(inv.id)}>
                      Cancel
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