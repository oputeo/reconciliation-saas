/** Infer institution/channel label from test-pack style IDs (TX-kuda-0003590, KUDA-POS-003590). */
export function inferChannelLabel(
  transactionId?: string | null,
  reference?: string | null,
): string | null {
  const tx = String(transactionId ?? "").trim();
  const txMatch = tx.match(/^TX-([a-z0-9_]+)-/i);
  if (txMatch?.[1]) {
    return formatChannel(txMatch[1]);
  }

  const ref = String(reference ?? "").trim();
  const refMatch = ref.match(/^([A-Za-z]+)-/);
  if (refMatch?.[1] && refMatch[1].length >= 2) {
    return formatChannel(refMatch[1]);
  }

  return null;
}

export function transactionIdFromAnomalyId(anomalyId?: string | null): string | null {
  const id = String(anomalyId ?? "").trim();
  if (!id.startsWith("AN-")) return null;
  return id.slice(3) || null;
}

function formatChannel(raw: string): string {
  const normalized = raw.replace(/_/g, " ").trim();
  if (!normalized) return raw;
  return normalized
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}