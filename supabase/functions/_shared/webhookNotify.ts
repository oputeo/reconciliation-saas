import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type WebhookEvent =
  | "ingest.completed"
  | "reconciliation.completed"
  | "schedule.completed"
  | "anomaly.spike";

export async function notifyTenantWebhook(
  supabase: SupabaseClient,
  tenantId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
): Promise<{ sent: boolean; reason?: string }> {
  const { data: tenant } = await supabase
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .maybeSingle();

  const webhookUrl = (tenant?.settings as Record<string, unknown> | null)?.integrations as
    | Record<string, unknown>
    | undefined;
  const url = typeof webhookUrl?.webhook_url === "string" ? webhookUrl.webhook_url : null;

  if (!url) return { sent: false, reason: "no_webhook_url" };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        tenant_id: tenantId,
        timestamp: new Date().toISOString(),
        ...payload,
      }),
    });
    if (!res.ok) {
      return { sent: false, reason: `http_${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      reason: err instanceof Error ? err.message : "fetch_failed",
    };
  }
}