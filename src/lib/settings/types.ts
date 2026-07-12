export interface TenantNotifications {
  email_alerts: boolean;
  anomaly_threshold: number;
  daily_digest: boolean;
}

export interface TenantReconciliation {
  default_tolerance: number;
  auto_resolve_low_risk: boolean;
  default_channel: string;
  fuzzy_tolerance_ngn: number;
  high_value_threshold_ngn: number;
  /** Operational reconciliation year (Jan 1 – Dec 31). Back audit derives the prior N closed years. */
  current_audit_year: number;
  back_audit_years: number;
}

export interface TenantSecurity {
  session_timeout_minutes: number;
  require_email_verification: boolean;
  ip_allowlist_enabled: boolean;
}

export interface TenantIntegrations {
  power_bi_enabled: boolean;
  webhook_url: string | null;
}

export interface TenantSettings {
  notifications: TenantNotifications;
  reconciliation: TenantReconciliation;
  security: TenantSecurity;
  integrations: TenantIntegrations;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string | null;
  billing_email: string | null;
  timezone: string;
  currency: string;
  logo_url: string | null;
  plan: string;
  settings: TenantSettings;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  notifications: {
    email_alerts: true,
    anomaly_threshold: 85,
    daily_digest: false,
  },
  reconciliation: {
    default_tolerance: 2.0,
    auto_resolve_low_risk: false,
    default_channel: 'ALL',
    fuzzy_tolerance_ngn: 50,
    high_value_threshold_ngn: 500_000,
    current_audit_year: new Date().getFullYear(),
    back_audit_years: 10,
  },
  security: {
    session_timeout_minutes: 480,
    require_email_verification: true,
    ip_allowlist_enabled: false,
  },
  integrations: {
    power_bi_enabled: false,
    webhook_url: null,
  },
};

export function mergeTenantSettings(raw?: Partial<TenantSettings> | null): TenantSettings {
  return {
    notifications: { ...DEFAULT_TENANT_SETTINGS.notifications, ...raw?.notifications },
    reconciliation: {
      ...DEFAULT_TENANT_SETTINGS.reconciliation,
      ...raw?.reconciliation,
      current_audit_year:
        raw?.reconciliation?.current_audit_year ?? new Date().getFullYear(),
      back_audit_years: raw?.reconciliation?.back_audit_years ?? 10,
    },
    security: { ...DEFAULT_TENANT_SETTINGS.security, ...raw?.security },
    integrations: { ...DEFAULT_TENANT_SETTINGS.integrations, ...raw?.integrations },
  };
}