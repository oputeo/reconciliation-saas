export type AppRole = 'viewer' | 'auditor' | 'approver' | 'finance' | 'admin';

export const ROLE_LABELS: Record<string, string> = {
  viewer: 'Viewer',
  auditor: 'Auditor',
  approver: 'Finance Approver',
  finance: 'Finance Approver',
  admin: 'Administrator',
};

const ROLE_RANK: Record<string, number> = {
  viewer: 1,
  auditor: 2,
  approver: 3,
  finance: 3,
  admin: 4,
};

export function normalizeRole(role?: string | null): AppRole {
  const r = (role || 'viewer').toLowerCase();
  if (r === 'finance') return 'approver';
  if (['viewer', 'auditor', 'approver', 'admin'].includes(r)) return r as AppRole;
  return 'viewer';
}

export function hasMinRole(userRole: string | undefined, required: AppRole): boolean {
  const current = ROLE_RANK[normalizeRole(userRole)] ?? 0;
  const needed = ROLE_RANK[required] ?? 99;
  return current >= needed;
}

export type SettingsSection =
  | 'overview'
  | 'organization'
  | 'tenants'
  | 'users'
  | 'reconciliation'
  | 'fees'
  | 'notifications'
  | 'integrations'
  | 'ingest'
  | 'security';

export const SETTINGS_ACCESS: Record<SettingsSection, AppRole> = {
  overview: 'viewer',
  organization: 'admin',
  tenants: 'admin',
  users: 'admin',
  reconciliation: 'auditor',
  fees: 'approver',
  notifications: 'auditor',
  integrations: 'admin',
  ingest: 'auditor',
  security: 'admin',
};

export function canAccessSettingsSection(
  section: SettingsSection,
  role?: string | null,
): boolean {
  return hasMinRole(role ?? 'viewer', SETTINGS_ACCESS[section]);
}