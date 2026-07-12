'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2, XCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import { hasMinRole } from '@/lib/settings/permissions';
import {
  approveRuleChange,
  diffRuleChange,
  fetchPendingRuleChanges,
  rejectRuleChange,
  type RuleChangeRecord,
} from '@/lib/reconciliation/ruleChangesApi';
import { ensureReconciliationRules } from '@/lib/reconciliation/rulesApi';

export default function RuleApprovalPanel() {
  const { tenantId, isReady } = useActiveTenant();
  const { profile } = useAuth();
  const canApprove = hasMinRole(profile?.role, 'approver');

  const [pending, setPending] = useState<RuleChangeRecord[]>([]);
  const [ruleNames, setRuleNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [changes, rules] = await Promise.all([
        fetchPendingRuleChanges(tenantId),
        ensureReconciliationRules(tenantId),
      ]);
      setPending(changes);
      setRuleNames(Object.fromEntries(rules.map((r) => [r.rule_code, r.name])));
      if (changes.length && !selectedId) setSelectedId(changes[0].id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  }, [tenantId, selectedId]);

  useEffect(() => {
    if (isReady) load();
  }, [isReady, load]);

  const selected = pending.find((c) => c.id === selectedId) ?? null;

  const handleApprove = async () => {
    if (!selected) return;
    setActing(true);
    try {
      await approveRuleChange(selected.id, reviewNotes || undefined);
      toast.success(`Approved: ${selected.rule_code}`);
      setReviewNotes('');
      setSelectedId(null);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    if (!reviewNotes.trim()) {
      toast.error('Add review notes when rejecting a change');
      return;
    }
    setActing(true);
    try {
      await rejectRuleChange(selected.id, reviewNotes);
      toast.success(`Rejected: ${selected.rule_code}`);
      setReviewNotes('');
      setSelectedId(null);
      await load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Rejection failed');
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Pending ({pending.length})
            <Button variant="outline" size="sm" onClick={load}>
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pending.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No rule changes awaiting approval.
              <br />
              <Link href="/settings/rules" className="text-emerald-600 underline mt-2 inline-flex items-center gap-1">
                Settings → Rules <ExternalLink className="h-3 w-3" />
              </Link>
            </p>
          )}
          {pending.map((change) => (
            <button
              key={change.id}
              type="button"
              onClick={() => setSelectedId(change.id)}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                selectedId === change.id ? 'border-emerald-500 bg-emerald-50' : 'hover:bg-slate-50'
              }`}
            >
              <p className="font-medium">{ruleNames[change.rule_code] ?? change.rule_code}</p>
              <p className="text-xs text-muted-foreground mt-1">{change.change_summary}</p>
              <p className="text-xs text-slate-400 mt-2">
                {new Date(change.created_at).toLocaleString()}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Review change</CardTitle>
        </CardHeader>
        <CardContent>
          {!selected && (
            <p className="text-muted-foreground">Select a pending change to review.</p>
          )}

          {selected && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge>{selected.rule_code}</Badge>
                <Badge variant="outline">Pending</Badge>
                <span className="text-sm text-muted-foreground">{selected.change_summary}</span>
              </div>

              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left">Field</th>
                      <th className="p-3 text-left">Current</th>
                      <th className="p-3 text-left">Proposed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffRuleChange(selected).map((row) => (
                      <tr key={row.field} className="border-t">
                        <td className="p-3 font-medium capitalize">{row.field}</td>
                        <td className="p-3 font-mono text-xs text-slate-600 break-all">{row.before}</td>
                        <td className="p-3 font-mono text-xs text-emerald-700 break-all">{row.after}</td>
                      </tr>
                    ))}
                    {diffRuleChange(selected).length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-muted-foreground">
                          No field differences detected
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="space-y-2">
                <Label>Review notes {canApprove ? '(required for rejection)' : ''}</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Reason for approval or rejection…"
                  rows={3}
                  disabled={!canApprove}
                />
              </div>

              {!canApprove && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  Approver or admin role required to approve or reject changes.
                </p>
              )}

              {canApprove && (
                <div className="flex gap-3">
                  <Button onClick={handleApprove} disabled={acting} className="gap-2">
                    {acting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Approve &amp; publish
                  </Button>
                  <Button variant="destructive" onClick={handleReject} disabled={acting} className="gap-2">
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}