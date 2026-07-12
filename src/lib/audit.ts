// src/lib/audit.ts
import { supabase } from './supabase';

export const logAudit = async (
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: any
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('audit_logs').insert({
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email?.split('@')[0],
      role: user.user_metadata?.role || 'Unknown',
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details: details || {},
    });
  } catch (err) {
    console.error("Audit logging failed:", err);
  }
};