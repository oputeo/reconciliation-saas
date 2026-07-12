import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const DEFAULT_BACK_AUDIT_YEARS = 10;

export type AuditPeriodConfig = {
  currentAuditYear: number;
  backAuditYears: number;
};

type ReconciliationSettingsSlice = {
  current_audit_year?: number;
  back_audit_years?: number;
};

export function resolveAuditPeriodConfig(
  reconciliation?: ReconciliationSettingsSlice | null,
  refDate = new Date(),
): AuditPeriodConfig {
  const calendarYear = refDate.getFullYear();
  const year = Number(reconciliation?.current_audit_year);
  const lookback = Number(reconciliation?.back_audit_years);
  return {
    currentAuditYear: year >= 2000 && year <= 2100 ? year : calendarYear,
    backAuditYears: lookback >= 1 && lookback <= 30 ? lookback : DEFAULT_BACK_AUDIT_YEARS,
  };
}

export function currentReconciliationRange(config: AuditPeriodConfig): {
  start_date: string;
  end_date: string;
} {
  return {
    start_date: `${config.currentAuditYear}-01-01`,
    end_date: `${config.currentAuditYear}-12-31`,
  };
}

export function closedBackAuditRange(config: AuditPeriodConfig): {
  start_date: string;
  end_date: string;
} {
  const startYear = config.currentAuditYear - config.backAuditYears;
  const endYear = config.currentAuditYear - 1;
  return {
    start_date: `${startYear}-01-01`,
    end_date: `${endYear}-12-31`,
  };
}

export async function fetchTenantAuditPeriodConfig(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<AuditPeriodConfig> {
  const { data, error } = await supabase
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .maybeSingle();

  if (error) {
    console.warn("fetchTenantAuditPeriodConfig:", error.message);
    return resolveAuditPeriodConfig(null);
  }

  const settings = data?.settings as { reconciliation?: ReconciliationSettingsSlice } | null;
  return resolveAuditPeriodConfig(settings?.reconciliation ?? null);
}