'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, RefreshCw, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { invokeTenantFunction } from '@/lib/edgeFunctions';
import { toast } from 'sonner';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import { aggregateProductAudit } from '@/lib/reports/productAudit';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

interface Props {
  startDate?: string;
  endDate?: string;
}

export default function ProductAuditDashboard({ startDate = "2025-01-01", endDate = "2026-06-02" }: Props) {
  const { tenantId, isReady } = useActiveTenant();
  const [products, setProducts] = useState<any[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const fetchProductData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('master_ledger')
        .select('product_type, amount, audit_flag, audit_score, match_score, status')
        .eq('tenant_id', tenantId)
        .in('status', ['pending', 'matched', 'unmatched'])
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate);

      if (error) throw error;

      setProducts(aggregateProductAudit(data ?? []));
    } catch (err) {
      toast.error("Failed to load product data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady) fetchProductData();
  }, [startDate, endDate, tenantId, isReady]);

  const toggleRow = (productType: string) => {
    const newSet = new Set(expandedRows);
    newSet.has(productType) ? newSet.delete(productType) : newSet.add(productType);
    setExpandedRows(newSet);
  };

  const generateAIInsight = async (product: any) => {
    setAiLoading(prev => ({ ...prev, [product.product_type]: true }));

    try {
      const { data, error } = await invokeTenantFunction<{ analysis: string }>(
        'ai-insight',
        {
          metric_type: 'product_audit',
          metrics: {
            product: product.product_type.toUpperCase(),
            total_txns: product.total_txns,
            total_value: Math.round(product.total_value),
            flagged: product.flagged,
            flagged_percent: product.flagged_percent.toFixed(1),
            avg_score: product.avg_audit_score.toFixed(1),
          },
        },
        tenantId,
      );

      if (error) throw error;
      if (!data?.analysis) throw new Error('No analysis returned');

      setAiInsights(prev => ({
        ...prev,
        [product.product_type]: data.analysis
      }));
    } catch (err) {
      const fallback = `**${product.product_type.toUpperCase()} Performance**\nHigh flagged rate (${product.flagged_percent.toFixed(1)}%) indicates reconciliation issues.\n**Recommendation:** Review the ${product.flagged} flagged transactions and strengthen matching rules with the partner.`;
      
      setAiInsights(prev => ({
        ...prev,
        [product.product_type]: fallback
      }));
      toast.error(`AI busy. Showing local insight for ${product.product_type}.`);
    } finally {
      setAiLoading(prev => ({ ...prev, [product.product_type]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Product Performance & Audit Summary
            <Button onClick={fetchProductData} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left">Product</th>
                  <th className="p-4 text-right">Total Txns</th>
                  <th className="p-4 text-right">Total Value</th>
                  <th className="p-4 text-right">Flagged</th>
                  <th className="p-4 text-right">Flagged %</th>
                  <th className="p-4 text-right">Avg Score</th>
                  <th className="p-4 text-center">Risk</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isExpanded = expandedRows.has(p.product_type);
                  const aiInsight = aiInsights[p.product_type];

                  return (
                    <React.Fragment key={p.product_type}>
                      <tr className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => toggleRow(p.product_type)}>
                        <td className="p-4 font-medium capitalize">{p.product_type}</td>
                        <td className="p-4 text-right">{p.total_txns.toLocaleString()}</td>
                        <td className="p-4 text-right">₦{p.total_value.toLocaleString()}</td>
                        <td className="p-4 text-right text-orange-600 font-medium">{p.flagged}</td>
                        <td className="p-4 text-right">{p.flagged_percent.toFixed(1)}%</td>
                        <td className="p-4 text-right font-medium">{p.avg_audit_score.toFixed(1)}</td>
                        <td className="p-4 text-center">
                          <Badge variant={
                            p.risk === 'High' ? 'destructive'
                              : p.risk === 'Medium' ? 'secondary'
                                : p.risk === 'Pending' ? 'outline'
                                  : 'outline'
                          }>
                            {p.risk}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="bg-slate-50 p-6">
                            <div className="bg-white rounded-2xl p-6 border space-y-6">
                              <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-lg">AI Executive Insight — {p.product_type.toUpperCase()}</h3>
                                <Button 
                                  onClick={() => generateAIInsight(p)} 
                                  disabled={aiLoading[p.product_type]}
                                  size="sm"
                                >
                                  <Sparkles className="mr-2 h-4 w-4" />
                                  {aiLoading[p.product_type] ? "Analyzing..." : "Get AI Insight"}
                                </Button>
                              </div>

                              {aiInsight && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-emerald-800 leading-relaxed whitespace-pre-line">
                                  {aiInsight}
                                </div>
                              )}

                              <div className="w-full overflow-x-auto">
                                <BarChart
                                  width={520}
                                  height={192}
                                  data={[
                                    { name: 'Total', value: p.total_txns },
                                    { name: 'Flagged', value: p.flagged },
                                  ]}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <Tooltip />
                                  <Bar dataKey="value" fill="#3b82f6" />
                                </BarChart>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}