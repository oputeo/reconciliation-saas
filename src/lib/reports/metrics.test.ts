import { describe, expect, it } from 'vitest';
import { exportMetricsCsv } from './metrics';

describe('exportMetricsCsv', () => {
  it('exports metric rows and trend data', () => {
    const csv = exportMetricsCsv(
      {
        totalRecords: 100,
        matchedRecords: 80,
        unmatchedRecords: 10,
        pendingRecords: 10,
        accuracy: 88.9,
        totalLeakage: 5000,
        riskScore: 22,
        openAnomalies: 3,
        lastUpdated: '12:00',
      },
      [{ month: 'Jan', accuracy: 90, leakage: 1000 }],
    );

    expect(csv).toContain('total_records,100');
    expect(csv).toContain('month,accuracy,leakage');
    expect(csv).toContain('Jan,90,1000');
  });
});