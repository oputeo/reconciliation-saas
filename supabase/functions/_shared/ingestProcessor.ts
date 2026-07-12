import {
  mapCsvRowToLedger,
  resolveReportSide,
  validateReportHeaders,
  type MappedLedgerRow,
  type ReportSide,
  type ReportType,
} from "./reportMappers.ts";

export type LedgerInsertRow = MappedLedgerRow & { tenant_id: string };

export function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current.trim());
  return values;
}

export function parseCsvText(csvText: string): { headers: string[]; rows: string[][] } {
  const lines = csvText.trim().split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const rows = lines.slice(1).map((line) =>
    parseCsvLine(line).map((v) => v.replace(/^"|"$/g, ""))
  );
  return { headers, rows };
}

export function normalizeJsonRow(raw: Record<string, unknown>): string[] {
  return Object.values(raw).map((v) => String(v ?? ""));
}

export function jsonRowsToMatrix(rows: Record<string, unknown>[]): {
  headers: string[];
  rows: string[][];
} {
  if (!rows.length) return { headers: [], rows: [] };
  const headers = Object.keys(rows[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const matrix = rows.map((row) =>
    headers.map((h) => {
      const key = Object.keys(row).find(
        (k) => k.toLowerCase().replace(/\s+/g, "_") === h,
      );
      return String(key ? row[key] ?? "" : "");
    })
  );
  return { headers, rows: matrix };
}

export function processIngestData(
  tenantId: string,
  reportType: ReportType,
  reportSideInput: ReportSide | undefined,
  headers: string[],
  dataRows: string[][],
  maxRows = 50_000,
): { records: LedgerInsertRow[]; skipped: number; errors: string[] } {
  const errors: string[] = [];
  const reportSide = resolveReportSide(reportType, reportSideInput);

  const validation = validateReportHeaders(headers, reportType);
  if (!validation.ok) {
    errors.push(`Missing columns: ${validation.missing.join(", ")}`);
    return { records: [], skipped: 0, errors };
  }

  if (dataRows.length > maxRows) {
    errors.push(`Row limit exceeded (${maxRows})`);
    return { records: [], skipped: 0, errors };
  }

  const records: LedgerInsertRow[] = [];
  let skipped = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const mapped = mapCsvRowToLedger(headers, dataRows[i], reportType, reportSide, i + 1);
    if (!mapped) {
      skipped++;
      continue;
    }
    records.push({
      tenant_id: tenantId,
      ...mapped,
    });
  }

  if (!records.length && !errors.length) {
    errors.push("No valid rows after mapping");
  }

  return { records, skipped, errors };
}

export function processCsvIngest(
  tenantId: string,
  csvText: string,
  reportType: ReportType,
  reportSide?: ReportSide,
): ReturnType<typeof processIngestData> {
  const { headers, rows } = parseCsvText(csvText);
  if (!headers.length) {
    return { records: [], skipped: 0, errors: ["CSV is empty or invalid"] };
  }
  return processIngestData(tenantId, reportType, reportSide, headers, rows);
}

export function processJsonIngest(
  tenantId: string,
  payload: Record<string, unknown>[],
  reportType: ReportType,
  reportSide?: ReportSide,
): ReturnType<typeof processIngestData> {
  const { headers, rows } = jsonRowsToMatrix(payload);
  if (!headers.length) {
    return { records: [], skipped: 0, errors: ["JSON rows array is empty"] };
  }
  return processIngestData(tenantId, reportType, reportSide, headers, rows);
}