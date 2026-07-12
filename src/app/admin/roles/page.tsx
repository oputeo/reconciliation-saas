'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, RefreshCw, Send, CheckCircle, Copy, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useActiveTenant } from '@/hooks/useActiveTenant';

type AppRole = 'viewer' | 'auditor' | 'approver' | 'admin';

interface AccessRequest {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  status: string;
  role?: AppRole;
  tenant_id?: string;
  requested_at: string;
  signup_url?: string;
}

const ROLE_LABELS: Record<AppRole, string> = {
  viewer: 'Viewer',
  auditor: 'Auditor',
  approver: 'Finance Approver',
  admin: 'Admin',
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://oeosolution.com';

function buildSignupUrl(email: string) {
  return `${SITE_URL}/accept-invite?email=${encodeURIComponent(email)}`;
}

async function getSessionOrThrow() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.access_token || !session.user) {
    throw new Error('You must be signed in');
  }
  return session;
}

async function getCallerTenantId(userId: string) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('tenant_id, role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/** Parse real error from edge function 400 responses */
async function parseFunctionError(error: unknown): Promise<string> {
  if (!error || typeof error !== 'object') return 'Request failed';

  const fnError = error as { message?: string; context?: Response };
  if (fnError.context && typeof fnError.context.json === 'function') {
    try {
      const payload = await fnError.context.json();
      return payload?.error || payload?.message || fnError.message || 'Request failed';
    } catch {
      // fall through
    }
  }
  return fnError.message || 'Request failed';
}

async function callAdminUsers(body: Record<string, unknown>) {
  const session = await getSessionOrThrow();

  const { data, error } = await supabase.functions.invoke('admin-users', {
    body,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) {
    throw new Error(await parseFunctionError(error));
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.success) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
}

export default function AdminRolesPage() {
  const { tenantId, isReady } = useActiveTenant();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('viewer');

  /** Direct DB fetch — avoids 400 from old edge function missing list_pending */
  const fetchRequests = useCallback(async (silent = false) => {
    if (!isReady) return;

    try {
      const session = await getSessionOrThrow();
      const callerRole = await getCallerTenantId(session.user.id);
      const scopedTenantId = tenantId || callerRole?.tenant_id;

      let query = supabase
        .from('access_requests')
        .select('id, full_name, email, phone, status, role, tenant_id, requested_at')
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (scopedTenantId) {
        query = query.eq('tenant_id', scopedTenantId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRequests(
        (data || []).map((row) => ({
          ...row,
          signup_url: buildSignupUrl(row.email),
        }))
      );
    } catch (err: unknown) {
      if (!silent) {
        const message = err instanceof Error ? err.message : 'Failed to load requests';
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId, isReady]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(() => fetchRequests(true), 8000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const copySignupLink = async (req: AccessRequest) => {
    const url = req.signup_url || buildSignupUrl(req.email);
    setCopyingId(req.id);

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Signup link copied', {
        description: `Share this link with ${req.email}`,
      });
    } catch {
      toast.error('Could not copy link', { description: url });
    } finally {
      setCopyingId(null);
    }
  };

  /** Invite via edge function, fallback to direct DB insert */
  const saveInvite = async (email: string, role: AppRole, fullName?: string) => {
    const displayName = fullName || email.split('@')[0] || 'New User';
    const signupUrl = buildSignupUrl(email);

    try {
      const data = await callAdminUsers({
        action: 'invite',
        email,
        role,
        full_name: displayName,
      });
      return { signupUrl: data.signup_url || signupUrl, resent: Boolean(data.resent) };
    } catch (edgeErr) {
      // Fallback if edge function is old or fails
      const session = await getSessionOrThrow();
      const callerRole = await getCallerTenantId(session.user.id);

      const { data: existing } = await supabase
        .from('access_requests')
        .select('id')
        .eq('email', email)
        .eq('status', 'pending')
        .maybeSingle();

      const payload = {
        full_name: displayName,
        email,
        phone: null,
        status: 'pending',
        role,
        tenant_id: tenantId || callerRole?.tenant_id || null,
        requested_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase
          .from('access_requests')
          .update(payload)
          .eq('id', existing.id);
        if (error) throw error;
        return { signupUrl, resent: true };
      }

      const { error } = await supabase.from('access_requests').insert(payload);
      if (error) throw error;
      return { signupUrl, resent: false };
    }
  };

  const inviteUser = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return toast.error('Please enter an email');

    setInviting(true);
    try {
      const { signupUrl, resent } = await saveInvite(email, inviteRole);

      try {
        await navigator.clipboard.writeText(signupUrl);
        toast.success(resent ? 'Invite updated' : 'Invite recorded', {
          description: `Signup link copied for ${email}`,
        });
      } catch {
        toast.success(resent ? 'Invite updated' : 'Invite recorded', {
          description: signupUrl,
        });
      }

      setInviteEmail('');
      fetchRequests(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save invite';
      toast.error(message);
    } finally {
      setInviting(false);
    }
  };

  const resendInvitation = async (req: AccessRequest) => {
    setResendingId(req.id);
    try {
      const { signupUrl } = await saveInvite(
        req.email,
        (req.role as AppRole) || 'viewer',
        req.full_name
      );

      try {
        await navigator.clipboard.writeText(signupUrl);
        toast.success(`Invite refreshed for ${req.email}`, {
          description: 'Updated signup link copied',
        });
      } catch {
        toast.success(`Invite refreshed for ${req.email}`, { description: signupUrl });
      }

      fetchRequests(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to refresh invite';
      toast.error(message);
    } finally {
      setResendingId(null);
    }
  };

  const cancelInvitation = async (req: AccessRequest) => {
    setCancellingId(req.id);
    try {
      try {
        await callAdminUsers({ action: 'cancel', request_id: req.id });
      } catch {
        const { error } = await supabase
          .from('access_requests')
          .update({ status: 'cancelled' })
          .eq('id', req.id);
        if (error) throw error;
      }

      toast.success(`Invite cancelled for ${req.email}`);
      fetchRequests(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to cancel invite';
      toast.error(message);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-5xl font-bold tracking-tighter text-slate-900">Admin Control Center</h1>
            <p className="text-emerald-700 text-xl">User Management & Invitations</p>
          </div>
          <Button onClick={() => fetchRequests()} variant="outline" disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Invite New User</CardTitle>
            <p className="text-sm text-slate-500">
              Saves a pending invite and copies a signup link to share with the user.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && inviteUser()}
              />
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                <SelectTrigger className="w-full sm:w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="auditor">Auditor</SelectItem>
                  <SelectItem value="approver">Finance Approver</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={inviteUser}
                disabled={inviting || !inviteEmail.trim()}
                className="min-w-[180px]"
              >
                {inviting ? 'Saving...' : 'Save Invite'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-emerald-600" />
              Pending Invitations ({requests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Requested On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.full_name}</TableCell>
                    <TableCell>{req.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {ROLE_LABELS[(req.role as AppRole) || 'viewer']}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(req.requested_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="default" className="flex items-center gap-1 w-fit">
                        <CheckCircle className="h-3 w-3" />
                        PENDING
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copySignupLink(req)}
                          disabled={copyingId === req.id}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          {copyingId === req.id ? 'Copying...' : 'Copy Link'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resendInvitation(req)}
                          disabled={resendingId === req.id}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {resendingId === req.id ? 'Refreshing...' : 'Refresh'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelInvitation(req)}
                          disabled={cancellingId === req.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          {cancellingId === req.id ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-slate-500">
                      No pending invitations yet
                    </TableCell>
                  </TableRow>
                )}
                {loading && requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-slate-500">
                      Loading invitations...
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}