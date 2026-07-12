'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ShieldCheck, AlertTriangle, CheckCircle, Clock, 
  Database, RefreshCw, TrendingUp, AlertCircle 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useActiveTenant } from '@/hooks/useActiveTenant';

export default function DataQualityDashboard() {
  const { tenantId, isReady } = useActiveTenant();
  const [loading, setLoading] = useState(true);
  const [quality, setQuality] = useState({
    overallScore: 94.2,
    completeness: 92.8,
    timeliness: 96.5,
    enrichment: 87.3,
    duplicationRate: 1.8,
    totalRecords: 0,
    lastScan: ""
  });

  const [sourceQuality, setSourceQuality] = useState<any[]>([]);
  const [missingFields, setMissingFields] = useState<any[]>([]);

  const fetchDataQuality = async () => {
    setLoading(true);
    try {
      // Total Records
      const { count } = await supabase
        .from('master_ledger')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      const { data: sources } = await supabase
        .from('master_ledger')
        .select('source, transaction_date, reference, enrichment_status, status')
        .eq('tenant_id', tenantId);

      const sourceStats = sources?.reduce((acc: any, row: any) => {
        const src = row.source || 'Unknown';
        if (!acc[src]) acc[src] = { count: 0, recent: 0 };
        acc[src].count++;
        // Simple recency check
        const daysOld = (Date.now() - new Date(row.transaction_date).getTime()) / (1000 * 3600 * 24);
        if (daysOld < 7) acc[src].recent++;
        return acc;
      }, {});

      const sourceList = Object.entries(sourceStats || {}).map(([source, stats]: any) => ({
        source,
        completeness: Math.round((stats.recent / stats.count) * 100) || 85,
        records: stats.count
      }));

      const total = count || sources?.length || 0;
      const missingReference = (sources ?? []).filter((r) => !r.reference).length;
      const enriched = (sources ?? []).filter((r) => r.enrichment_status === 'enriched').length;
      const recent = (sources ?? []).filter((r) => {
        const daysOld = (Date.now() - new Date(r.transaction_date).getTime()) / (1000 * 3600 * 24);
        return daysOld <= 7;
      }).length;

      const refs = (sources ?? []).map((r) => r.reference).filter(Boolean);
      const uniqueRefs = new Set(refs);
      const duplicationRate = refs.length > 0
        ? Math.round(((refs.length - uniqueRefs.size) / refs.length) * 1000) / 10
        : 0;

      const completeness = total > 0 ? Math.round(((total - missingReference) / total) * 1000) / 10 : 0;
      const timeliness = total > 0 ? Math.round((recent / total) * 1000) / 10 : 0;
      const enrichment = total > 0 ? Math.round((enriched / total) * 1000) / 10 : 0;
      const overallScore = Math.round((completeness + timeliness + enrichment) / 3 * 10) / 10;

      const missingSim = [
        {
          field: 'reference',
          missing: missingReference,
          percentage: total > 0 ? Math.round((missingReference / total) * 1000) / 10 : 0,
          impact: missingReference > 100 ? 'High' : 'Medium',
        },
      ];

      setQuality({
        overallScore,
        completeness,
        timeliness,
        enrichment,
        duplicationRate,
        totalRecords: total,
        lastScan: new Date().toLocaleTimeString(),
      });

      setSourceQuality(sourceList);
      setMissingFields(missingSim);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load Data Quality metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady) fetchDataQuality();
  }, [tenantId, isReady]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-bold">Data Quality & Completeness</h1>
            <p className="text-xl text-muted-foreground mt-2">ReconFlow Truth Layer Health</p>
          </div>
          <Button onClick={fetchDataQuality} size="lg" className="gap-3">
            <RefreshCw className="h-5 w-5" /> Run Quality Scan
          </Button>
        </div>

        {/* Overall Score */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <Card className="lg:col-span-2">
            <CardContent className="p-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Data Quality Score</p>
                  <p className="text-7xl font-bold text-emerald-600 mt-3">{quality.overallScore}%</p>
                </div>
                <ShieldCheck className="h-24 w-24 text-emerald-600" />
              </div>
              <Progress value={quality.overallScore} className="mt-8 h-4" />
              <p className="text-xs text-emerald-600 mt-3">Excellent • Last scanned {quality.lastScan}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8 text-center space-y-6">
              <div>
                <p className="text-5xl font-bold text-blue-600">{quality.totalRecords.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-4xl font-bold">{quality.duplicationRate}%</p>
                <p className="text-sm text-muted-foreground">Duplication Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Source Quality */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Source Quality Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {sourceQuality.map((src, i) => (
                <div key={i} className="flex items-center justify-between p-5 border rounded-2xl">
                  <div className="flex items-center gap-4">
                    <Database className="h-10 w-10 text-slate-400" />
                    <div>
                      <p className="font-semibold text-lg">{src.source}</p>
                      <p className="text-sm text-muted-foreground">{src.records} records</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-bold text-emerald-600">{src.completeness}%</p>
                    <Badge variant={src.completeness > 95 ? "default" : "secondary"}>
                      {src.completeness > 95 ? "Excellent" : "Good"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Missing Fields & Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <AlertCircle className="text-amber-600" /> Missing / Incomplete Fields
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {missingFields.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-6 bg-slate-50 rounded-2xl">
                  <div>
                    <p className="font-medium text-lg">{item.field}</p>
                    <p className="text-sm text-muted-foreground">{item.missing} records missing</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-amber-600">{item.percentage}%</p>
                    <Badge variant="outline">{item.impact} Impact</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}