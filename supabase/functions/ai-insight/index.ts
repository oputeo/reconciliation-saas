import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { requireTenantAccess } from "../_shared/auth.ts"
import {
  inferChannelLabel,
  transactionIdFromAnomalyId,
} from "../_shared/channelInference.ts"

function anomalyContext(anomaly: Record<string, unknown>) {
  const anomalyId = String(anomaly.anomaly_id || anomaly.id || "")
  const transactionId = transactionIdFromAnomalyId(anomalyId) || anomalyId
  const channel =
    (typeof anomaly.bank === "string" && anomaly.bank.trim()) ||
    inferChannelLabel(transactionId) ||
    "Unknown channel"
  const ruleTag = String(anomaly.notes || anomaly.suggested_action || "")
  const ruleCode = ruleTag.startsWith("rule:") ? ruleTag.slice(5) : ruleTag || "EXC_UNMATCHED"
  return {
    anomalyId,
    transactionId,
    channel,
    ruleCode,
    type: String(anomaly.type || "Unmatched Transaction"),
    rootCause: String(
      anomaly.root_cause || "No matching counterpart found in the reconciliation pool",
    ),
    variance: Number(anomaly.variance) || 0,
    date: String(anomaly.date || "unknown date"),
    severity: String(anomaly.severity || "Medium"),
  }
}

function buildLocalInsight(body: Record<string, unknown>): string {
  const anomaly = body.anomaly as Record<string, unknown> | undefined
  const metrics = body.metrics as Record<string, unknown> | undefined
  const metricType = String(body.metric_type || "")

  if (anomaly) {
    const ctx = anomalyContext(anomaly)
    return `**Root Cause:** ${ctx.rootCause} (${ctx.type}, rule ${ctx.ruleCode}) for ${ctx.transactionId} on ${ctx.channel}.
**Impact:** ₦${ctx.variance.toLocaleString()}
**Immediate Actions:**
• Search ${ctx.channel} settlement uploads for a counterpart to ${ctx.transactionId} on ${ctx.date}
• Verify reference, amount (₦${ctx.variance.toLocaleString()}), and product type align across internal vs settlement files
• If settlement is missing, re-upload the partner file and re-run reconciliation for that audit year
**Prevention:** Ensure settlement ingest covers ${ctx.channel} before closing the audit period; review rule ${ctx.ruleCode} thresholds if false positives appear.`
  }

  if (metricType === "product_audit" && metrics) {
    const product = metrics.product || "PRODUCT"
    const flaggedPct = metrics.flagged_percent || "0"
    const flagged = metrics.flagged || 0
    return `**${product} Performance**
Flagged rate is ${flaggedPct}% (${flagged} transactions).
**Recommendation:** Review flagged items first, then reconcile partner statements for this product line.
**Next step:** Run a targeted back-audit on the highest-variance dates.`
  }

  if (metrics) {
    const accuracy = metrics.accuracy ?? "N/A"
    const leakage = metrics.totalLeakage ?? metrics.total_leakage ?? 0
    const records = metrics.totalRecords ?? metrics.total_records ?? 0
    return `**Executive Summary**
• Total records: ${records}
• Match accuracy: ${accuracy}%
• Estimated leakage: ₦${Number(leakage).toLocaleString()}
**Recommendation:** Prioritize open anomalies with the highest variance and re-run reconciliation after settlement uploads.`
  }

  return "Analysis completed using local rules. Configure GROQ_API_KEY for full AI insights."
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const tenantId = String(body.tenant_id || "").trim()
    const access = await requireTenantAccess(req, tenantId, "viewer")
    if (access instanceof Response) return access

    const { anomaly, metrics, metric_type: metricType } = body

    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ success: true, analysis: buildLocalInsight(body) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    let prompt = ""

    if (anomaly) {
      const ctx = anomalyContext(anomaly as Record<string, unknown>)
      prompt = `You are a Senior Revenue Assurance Auditor for Nigerian fintech reconciliation.

Transaction ID: ${ctx.transactionId}
Channel/Partner: ${ctx.channel}
Anomaly type: ${ctx.type}
Rule triggered: ${ctx.ruleCode}
Transaction date: ${ctx.date}
Severity: ${ctx.severity}
System root cause: ${ctx.rootCause}
Variance: ₦${ctx.variance.toLocaleString()}
Description: ${anomaly.description || ctx.type}

Use the channel name "${ctx.channel}" — never call it "unknown bank" if channel is known.
Focus on internal ledger vs settlement mismatch, missing settlement upload, timing, or reference mismatch.

Respond in this format:
**Root Cause:** [One sentence grounded in the system root cause above]
**Impact:** ₦${ctx.variance.toLocaleString()}
**Immediate Actions:**
• [Action 1]
• [Action 2]
**Prevention:** [One fix]`
    } else if (metrics) {
      const label = metricType ? ` (${metricType})` : ""
      prompt = `You are a fintech reconciliation executive analyst. Analyze this metric${label}: ${JSON.stringify(metrics)}. Be concise and actionable.`
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "metrics or anomaly is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.25,
        max_tokens: 550,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`)
    }

    const data = await response.json()
    const analysis = data.choices?.[0]?.message?.content?.trim() || buildLocalInsight(body)

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("AI Insight Error:", message)
    return new Response(
      JSON.stringify({
        success: true,
        analysis: "AI service is temporarily busy. Please try again shortly.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})