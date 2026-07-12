import type { TenantReconciliation } from '@/lib/settings/types';

/** Default lookback when tenant settings omit back_audit_years. */
export const BACK_AUDIT_YEARS = 10;

export type DateRange = { startDate: string; endDate: string };

export type AuditPeriodConfig = {
  currentAuditYear: number;
  backAuditYears: number;
};

export function resolveAuditPeriodConfig(
  reconciliation?: Partial<TenantReconciliation> | null,
  refDate: Date = new Date(),
): AuditPeriodConfig {
  const calendarYear = refDate.getFullYear();
  const year = Number(reconciliation?.current_audit_year);
  const lookback = Number(reconciliation?.back_audit_years);
  return {
    currentAuditYear: year >= 2000 && year <= 2100 ? year : calendarYear,
    backAuditYears: lookback >= 1 && lookback <= 30 ? lookback : BACK_AUDIT_YEARS,
  };
}

/** Full calendar year for operational reconciliation. */
export function getCurrentReconciliationRange(
  config: AuditPeriodConfig = resolveAuditPeriodConfig(),
): DateRange {
  return {
    startDate: `${config.currentAuditYear}-01-01`,
    endDate: `${config.currentAuditYear}-12-31`,
  };
}

/** Closed periods: Jan 1 (auditYear − N) through Dec 31 (auditYear − 1). */
export function getDefaultBackAuditRange(
  config: AuditPeriodConfig = resolveAuditPeriodConfig(),
): DateRange {
  const startYear = config.currentAuditYear - config.backAuditYears;
  const endYear = config.currentAuditYear - 1;
  return {
    startDate: `${startYear}-01-01`,
    endDate: `${endYear}-12-31`,
  };
}

export function formatBackAuditPeriodLabel(
  range: DateRange = getDefaultBackAuditRange(),
): string {
  return `${range.startDate} → ${range.endDate}`;
}

export function formatReconciliationPeriodLabel(
  range: DateRange = getCurrentReconciliationRange(),
): string {
  return `${range.startDate} → ${range.endDate}`;
}

export function getCurrentReconciliationYear(
  config: AuditPeriodConfig = resolveAuditPeriodConfig(),
): number {
  return config.currentAuditYear;
}

export function getCurrentYearReconciliationLabel(
  config: AuditPeriodConfig = resolveAuditPeriodConfig(),
): string {
  return `${config.currentAuditYear} operational matching (${formatReconciliationPeriodLabel(getCurrentReconciliationRange(config))})`;
}

export type BackAuditResult = {
  success?: boolean;
  error?: string;
  message?: string;
  job_id?: number;
  total_scanned?: number;
  discrepancies_found?: number;
  period?: string;
  duration_seconds?: string;
};