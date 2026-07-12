'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import { useAuth } from '@/app/providers';
import { hasMinRole } from '@/lib/settings/permissions';
import {
  ensureReconciliationRules,
  fetchReconciliationRules,
  resetReconciliationRules,
  updateReconciliationRule,
} from '@/lib/reconciliation/rulesApi';
import {
  getPendingChangeForRule,
  proposeRuleChange,
  type RuleChangePatch,
  type RuleChangeRecord,
} from '@/lib/reconciliation/ruleChangesApi';
import type { ReconciliationRuleRecord } from '@/lib/reconciliation/rulesCatalog';

interface RuleEngineContextType {
  rules: ReconciliationRuleRecord[];
  activeRules: ReconciliationRuleRecord[];
  pendingByRuleId: Record<string, RuleChangeRecord>;
  loading: boolean;
  canEdit: boolean;
  canPropose: boolean;
  canDirectPublish: boolean;
  canReset: boolean;
  refreshRules: () => Promise<void>;
  saveRuleChange: (id: string, patch: RuleChangePatch, options?: { direct?: boolean }) => Promise<'published' | 'proposed'>;
  toggleRule: (id: string) => Promise<'published' | 'proposed'>;
  resetToDefaults: () => Promise<void>;
  getRulesForChannel: (channel: string) => ReconciliationRuleRecord[];
}

const RuleEngineContext = createContext<RuleEngineContextType | undefined>(undefined);

export function RuleEngineProvider({ children }: { children: ReactNode }) {
  const { tenantId, isReady } = useActiveTenant();
  const { profile } = useAuth();
  const [rules, setRules] = useState<ReconciliationRuleRecord[]>([]);
  const [pendingByRuleId, setPendingByRuleId] = useState<Record<string, RuleChangeRecord>>({});
  const [loading, setLoading] = useState(true);

  const canPropose = hasMinRole(profile?.role, 'auditor');
  const canDirectPublish = profile?.role === 'admin';
  const canEdit = canPropose;
  const canReset = profile?.role === 'admin';

  const refreshRules = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await ensureReconciliationRules(tenantId);
      setRules(data);
      const pendingMap: Record<string, RuleChangeRecord> = {};
      await Promise.all(
        data.map(async (rule) => {
          if (!rule.id) return;
          const pending = await getPendingChangeForRule(tenantId, rule.id).catch(() => null);
          if (pending) pendingMap[rule.id] = pending;
        }),
      );
      setPendingByRuleId(pendingMap);
    } catch {
      const fallback = await fetchReconciliationRules(tenantId).catch(() => []);
      setRules(fallback);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (isReady && tenantId) refreshRules();
  }, [isReady, tenantId, refreshRules]);

  const saveRuleChange = async (
    id: string,
    patch: RuleChangePatch,
    options?: { direct?: boolean },
  ): Promise<'published' | 'proposed'> => {
    const current = rules.find((r) => r.id === id);
    if (!current?.id || !tenantId) throw new Error('Rule not found');

    if (options?.direct && canDirectPublish) {
      const updated = await updateReconciliationRule(id, current.version ?? 1, patch);
      setRules((prev) => prev.map((r) => (r.id === id ? updated : r)));
      return 'published';
    }

    if (!canPropose) throw new Error('You do not have permission to propose rule changes');

    const change = await proposeRuleChange(tenantId, current, patch);
    setPendingByRuleId((prev) => ({ ...prev, [id]: change }));
    return 'proposed';
  };

  const toggleRule = async (id: string) => {
    const current = rules.find((r) => r.id === id);
    if (!current) throw new Error('Rule not found');
    return saveRuleChange(id, { active: !current.active });
  };

  const resetToDefaults = async () => {
    if (!tenantId) return;
    const data = await resetReconciliationRules(tenantId);
    setRules(data);
    setPendingByRuleId({});
  };

  const activeRules = useMemo(() => rules.filter((r) => r.active), [rules]);

  const getRulesForChannel = (channel: string) =>
    activeRules.filter(
      (r) =>
        r.category === 'channel' &&
        JSON.stringify(r.config).toLowerCase().includes(channel.toLowerCase()),
    );

  return (
    <RuleEngineContext.Provider
      value={{
        rules,
        activeRules,
        pendingByRuleId,
        loading,
        canEdit,
        canPropose,
        canDirectPublish,
        canReset,
        refreshRules,
        saveRuleChange,
        toggleRule,
        resetToDefaults,
        getRulesForChannel,
      }}
    >
      {children}
    </RuleEngineContext.Provider>
  );
}

export const useRuleEngine = () => {
  const context = useContext(RuleEngineContext);
  if (!context) throw new Error('useRuleEngine must be used within a RuleEngineProvider');
  return context;
};