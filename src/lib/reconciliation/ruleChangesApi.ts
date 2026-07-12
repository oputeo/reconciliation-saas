import { supabase } from '@/lib/supabase';
import type { ReconciliationRuleRecord } from '@/lib/reconciliation/rulesCatalog';

export type RuleChangeStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface RuleChangeRecord {
  id: string;
  tenant_id: string;
  rule_id: string;
  rule_code: string;
  status: RuleChangeStatus;
  proposed_name: string | null;
  proposed_description: string | null;
  proposed_config: Record<string, unknown> | null;
  proposed_active: boolean | null;
  proposed_priority: number | null;
  previous_snapshot: Record<string, unknown>;
  change_summary: string | null;
  proposed_by: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export type RuleChangePatch = Partial<
  Pick<ReconciliationRuleRecord, 'name' | 'description' | 'config' | 'active' | 'priority'>
>;

function buildChangeSummary(
  before: ReconciliationRuleRecord,
  patch: RuleChangePatch,
): string {
  const parts: string[] = [];
  if (patch.name && patch.name !== before.name) parts.push(`name → ${patch.name}`);
  if (patch.active !== undefined && patch.active !== before.active) {
    parts.push(patch.active ? 'enable rule' : 'disable rule');
  }
  if (patch.config) parts.push('config thresholds updated');
  if (patch.priority !== undefined && patch.priority !== before.priority) {
    parts.push(`priority → ${patch.priority}`);
  }
  return parts.length ? parts.join('; ') : 'Rule metadata update';
}

export function diffRuleChange(change: RuleChangeRecord): { field: string; before: string; after: string }[] {
  const snap = change.previous_snapshot as Record<string, unknown>;
  const rows: { field: string; before: string; after: string }[] = [];

  const add = (field: string, before: unknown, after: unknown) => {
    const b = JSON.stringify(before ?? null);
    const a = JSON.stringify(after ?? null);
    if (b !== a) rows.push({ field, before: b, after: a });
  };

  add('name', snap.name, change.proposed_name);
  add('description', snap.description, change.proposed_description);
  add('active', snap.active, change.proposed_active);
  add('priority', snap.priority, change.proposed_priority);
  add('config', snap.config, change.proposed_config);

  return rows;
}

export async function fetchRuleChanges(
  tenantId: string,
  status?: RuleChangeStatus,
): Promise<RuleChangeRecord[]> {
  let query = supabase
    .from('reconciliation_rule_changes')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as RuleChangeRecord[];
}

export async function fetchPendingRuleChanges(tenantId: string): Promise<RuleChangeRecord[]> {
  return fetchRuleChanges(tenantId, 'pending');
}

export async function proposeRuleChange(
  tenantId: string,
  rule: ReconciliationRuleRecord,
  patch: RuleChangePatch,
  changeSummary?: string,
): Promise<RuleChangeRecord> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in');
  if (!rule.id) throw new Error('Rule id is required');

  const snapshot = {
    name: rule.name,
    description: rule.description,
    config: rule.config,
    active: rule.active,
    priority: rule.priority,
    version: rule.version ?? 1,
  };

  const { data, error } = await supabase
    .from('reconciliation_rule_changes')
    .insert({
      tenant_id: tenantId,
      rule_id: rule.id,
      rule_code: rule.rule_code,
      status: 'pending',
      proposed_name: patch.name ?? rule.name,
      proposed_description: patch.description ?? rule.description,
      proposed_config: patch.config ?? rule.config,
      proposed_active: patch.active ?? rule.active,
      proposed_priority: patch.priority ?? rule.priority,
      previous_snapshot: snapshot,
      change_summary: changeSummary ?? buildChangeSummary(rule, patch),
      proposed_by: user.id,
    })
    .select('*')
    .single();

  if (error) {
    const pgError = error as { code?: string; message?: string };
    if (
      pgError.code === '23505' ||
      pgError.message?.includes('reconciliation_rule_changes_one_pending_per_rule')
    ) {
      throw new Error('This rule already has a pending change. Cancel it or wait for approval.');
    }
    throw new Error(error.message);
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    user_id: user.id,
    action: 'rule_change.proposed',
    resource_type: 'reconciliation_rule',
    resource_id: rule.rule_code,
    metadata: { change_id: data.id, change_summary: data.change_summary },
  });

  return data as RuleChangeRecord;
}

export async function approveRuleChange(
  changeId: string,
  reviewNotes?: string,
): Promise<void> {
  const { data, error } = await supabase.rpc('approve_reconciliation_rule_change', {
    p_change_id: changeId,
    p_review_notes: reviewNotes ?? null,
  });
  if (error) throw new Error(error.message);
  if (data?.success === false) throw new Error(data?.error ?? 'Approval failed');
}

export async function rejectRuleChange(
  changeId: string,
  reviewNotes?: string,
): Promise<void> {
  const { data, error } = await supabase.rpc('reject_reconciliation_rule_change', {
    p_change_id: changeId,
    p_review_notes: reviewNotes ?? null,
  });
  if (error) throw new Error(error.message);
  if (data?.success === false) throw new Error(data?.error ?? 'Rejection failed');
}

export async function cancelRuleChange(changeId: string): Promise<void> {
  const { error } = await supabase
    .from('reconciliation_rule_changes')
    .update({ status: 'cancelled', reviewed_at: new Date().toISOString() })
    .eq('id', changeId)
    .eq('status', 'pending');

  if (error) throw new Error(error.message);
}

export async function getPendingChangeForRule(
  tenantId: string,
  ruleId: string,
): Promise<RuleChangeRecord | null> {
  const { data, error } = await supabase
    .from('reconciliation_rule_changes')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('rule_id', ruleId)
    .eq('status', 'pending')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as RuleChangeRecord) ?? null;
}