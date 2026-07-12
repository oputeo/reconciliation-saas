'use client';

import { useMemo } from 'react';
import { useTenantSettings } from '@/hooks/useTenantSettings';
import {
  formatBackAuditPeriodLabel,
  formatReconciliationPeriodLabel,
  getCurrentReconciliationRange,
  getCurrentReconciliationYear,
  getDefaultBackAuditRange,
  resolveAuditPeriodConfig,
} from '@/lib/backAudit';

/** Tenant-settings-driven reconciliation and back-audit windows. */
export function useAuditPeriods() {
  const { tenant, loading } = useTenantSettings();

  const config = useMemo(
    () => resolveAuditPeriodConfig(tenant?.settings?.reconciliation),
    [tenant?.settings?.reconciliation],
  );

  const reconciliationRange = useMemo(
    () => getCurrentReconciliationRange(config),
    [config],
  );

  const backAuditRange = useMemo(
    () => getDefaultBackAuditRange(config),
    [config],
  );

  return {
    config,
    reconciliationRange,
    backAuditRange,
    reconciliationYear: getCurrentReconciliationYear(config),
    backAuditYears: config.backAuditYears,
    reconciliationPeriodLabel: formatReconciliationPeriodLabel(reconciliationRange),
    backAuditPeriodLabel: formatBackAuditPeriodLabel(backAuditRange),
    loading,
  };
}