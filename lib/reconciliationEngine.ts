// lib/reconciliationEngine.ts
import Papa from 'papaparse';

export type Transaction = {
  reference: string;
  amount: number;
  date: string;
  description?: string;
  type: 'credit' | 'debit';
  source: string;
  channel?: string;
};

export type ReconciliationRule = {
  id: string;
  name: string;
  channel: string;
  condition: string;
  action: string;
  tolerance: number;
  confidenceBoost: number;
  active: boolean;
};

export type MatchResult = {
  matched: number;
  unmatched: number;
  matchRate: number;
  totalVariance: number;
  anomalies: any[];
  confidenceScore: number;
};

export class ReconciliationEngine {
  /**
   * Parse uploaded CSV file
   */
  static async parseCSV(file: File): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const transactions = results.data
            .map((row: any) => ({
              reference: String(row.reference || row.Reference || `TX-${Date.now()}`),
              amount: parseFloat(row.amount || row.Amount || 0),
              date: String(row.date || row.Date || new Date().toISOString().split('T')[0]),
              description: String(row.description || row.Description || ""),
              type: (String(row.type || row.Type || "credit")).toLowerCase() as 'credit' | 'debit',
              source: String(row.source || "Unknown"),
              channel: String(row.channel || "General"),
            }))
            .filter(t => !isNaN(t.amount) && t.amount > 0);

          resolve(transactions);
        },
        error: (error) => reject(error),
      });
    });
  }

  /**
   * Main Reconciliation Engine - Accepts rules as parameter (No hook violation)
   */
  static async run(
    uploadedData: Transaction[], 
    ledgerData: Transaction[] = [],
    rules: ReconciliationRule[] = []
  ): Promise<MatchResult> {
    const result: MatchResult = {
      matched: 0,
      unmatched: 0,
      matchRate: 0,
      totalVariance: 0,
      anomalies: [],
      confidenceScore: 0,
    };

    for (const tx of uploadedData) {
      let matched = false;

      // Apply active rules with tolerance
      for (const rule of rules.filter(r => r.active)) {
        if (rule.channel !== "General" && rule.channel !== tx.channel) continue;

        const amountDiff = ledgerData.some(l => 
          Math.abs(l.amount - tx.amount) / Math.max(tx.amount, 1) * 100 <= rule.tolerance
        );

        const conditionMatch = rule.condition 
          ? (tx.description || "").toLowerCase().includes(rule.condition.toLowerCase())
          : true;

        if (amountDiff && conditionMatch) {
          result.matched++;
          matched = true;
          break;
        }
      }

      if (matched) continue;

      // Traditional fallback matching
      const exactMatch = ledgerData.find(l => 
        l.reference === tx.reference && Math.abs(l.amount - tx.amount) < 100
      );

      if (exactMatch) {
        result.matched++;
        continue;
      }

      // Record as anomaly
      const anomaly = this.analyzeRootCause(tx);
      result.anomalies.push(anomaly);
      result.unmatched++;
      result.totalVariance += Math.abs(tx.amount);
    }

    result.matchRate = uploadedData.length > 0 
      ? Math.round((result.matched / uploadedData.length) * 100) 
      : 0;

    result.confidenceScore = Math.min(98, Math.floor(result.matchRate * 0.93));

    return result;
  }

  private static analyzeRootCause(tx: Transaction) {
    return {
      reference: tx.reference,
      amount: tx.amount,
      type: "Unmatched Transaction",
      severity: tx.amount > 500000 ? "High" : "Medium",
      rootCause: "No matching rule or ledger entry found within tolerance",
      confidence: 65,
      suggestedAction: "Manual review required"
    };
  }
}