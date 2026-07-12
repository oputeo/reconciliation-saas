import { supabase } from '@/lib/supabase';
import type { ReconciliationRuleRecord } from '@/lib/reconciliation/rulesCatalog';

export async function fetchReconciliationRules(
  tenantId: string,
): Promise<ReconciliationRuleRecord[]> {
  const { data, error } = await supabase
    .from('reconciliation_rule_catalog')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('priority', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ReconciliationRuleRecord[];
}

export async function ensureReconciliationRules(
  tenantId: string,
): Promise<ReconciliationRuleRecord[]> {
  const existing = await fetchReconciliationRules(tenantId);
  if (existing.length > 0) return existing;

  const { error } = await supabase.rpc('seed_reconciliation_rule_catalog', {
    p_tenant_id: tenantId,
  });
  if (error) throw new Error(error.message);

  return fetchReconciliationRules(tenantId);
}

export async function updateReconciliationRule(
  ruleId: string,
  currentVersion: number,
  patch: Partial<Pick<ReconciliationRuleRecord, 'name' | 'description' | 'config' | 'active' | 'priority'>>,
): Promise<ReconciliationRuleRecord> {
  const { data: { user } } = await supabase.auth.getUser();
  const bumpsVersion = patch.config !== undefined || patch.active !== undefined;

  const { data, error } = await supabase
    .from('reconciliation_rule_catalog')
    .update({
      ...patch,
      version: bumpsVersion ? currentVersion + 1 : currentVersion,
      updated_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ruleId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as ReconciliationRuleRecord;
}

export async function resetReconciliationRules(
  tenantId: string,
): Promise<ReconciliationRuleRecord[]> {
  const { error: deleteError } = await supabase
    .from('reconciliation_rule_catalog')
    .delete()
    .eq('tenant_id', tenantId);

  if (deleteError) throw new Error(deleteError.message);
  return ensureReconciliationRules(tenantId);
}