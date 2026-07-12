'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import { fetchReportMetrics, fetchTrendData } from '@/lib/reports/metrics';
import { invokeTenantFunction } from '@/lib/edgeFunctions';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

interface Props {
  startDate?: string;
  endDate?: string;
}

export default function ReconFlowReport({ startDate = "2025-01-01", endDate = "2026-06-02" }: Props) {
  const { tenantId, isReady } = useActiveTenant();
  const [metrics, setMetrics] = useState({
    totalRecords: 0,
    accuracy: 0,
    totalLeakage: 0,
    riskScore: 0,
    lastUpdated: ""
  });

  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [aiInsights, setAiInsights] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [trendData, setTrendData] = useState<{ month: string; accuracy: number; leakage: number }[]>([]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const [reportMetrics, trend] = await Promise.all([
        fetchReportMetrics(tenantId),
        fetchTrendData(tenantId),
      ]);

      setMetrics({
        totalRecords: reportMetrics.totalRecords,
        accuracy: reportMetrics.accuracy,
        totalLeakage: reportMetrics.totalLeakage,
        riskScore: reportMetrics.riskScore,
        lastUpdated: reportMetrics.lastUpdated,
      });
      setTrendData(trend);
    } catch (err) {
      toast.error("Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady) fetchMetrics();
  }, [startDate, endDate, tenantId, isReady]);

  const toggleCard = (key: string) => {
    const newSet = new Set(expandedCards);
    newSet.has(key) ? newSet.delete(key) : newSet.add(key);
    setExpandedCards(newSet);
  };

  const generateAIInsight = async (key: string) => {
    setAiLoading(key);
    try {
      const { data, error } = await invokeTenantFunction<{ analysis: string }>(
        'ai-insight',
        { metric_type: key, metrics },
        tenantId,
      );

      if (error) throw error;
      if (!data?.analysis) throw new Error('No analysis returned');

      setAiInsights(prev => ({ ...prev, [key]: data.analysis }));
      toast.success("Executive AI Insight Generated");
    } catch (err) {
      toast.error("AI service temporarily unavailable. Using local insight.");
    } finally {
      setAiLoading(null);
    }
  };

  const kpiCards = [
    { 
      key: "totalRecords", 
      icon: "📊", 
      label: "Total Records", 
      value: metrics.totalRecords.toLocaleString(), 
      color: "text-blue-600" 
    },
    { 
      key: "accuracy", 
      icon: "✅", 
      label: "Accuracy Rate", 
      value: `${metrics.accuracy}%`, 
      color: "text-emerald-600" 
    },
    { 
      key: "totalLeakage", 
      icon: "⚠️", 
      label: "Potential Leakage", 
      value: `₦${metrics.totalLeakage.toLocaleString()}`, 
      color: "text-amber-600" 
    },
    { 
      key: "riskScore", 
      icon: "🎯", 
      label: "Risk Score", 
      value: metrics.riskScore, 
      color: "text-red-600" 
    },
  ];

  return (
    <div className="w-full min-w-0 space-y-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold">Executive Overview</h1>
          <p className="text-muted-foreground">Real-time Revenue Assurance Intelligence</p>
        </div>
        <Button onClick={fetchMetrics}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh Metrics
        </Button>
      </div>

      <div className="grid w-full min-w-0 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {kpiCards.map((card) => {
          const isExpanded = expandedCards.has(card.key);
          const aiInsight = aiInsights[card.key];

          return (
            <Card 
              key={card.key} 
              className="hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => toggleCard(card.key)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="text-4xl">{card.icon}</div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); generateAIInsight(card.key); }}
                    disabled={aiLoading === card.key}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg">{card.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-4xl font-bold ${card.color}`}>{card.value}</p>

                {isExpanded && (
                  <div className="mt-6 pt-6 border-t">
                    {aiInsight ? (
                      <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
                        <p className="text-emerald-800 whitespace-pre-line leading-relaxed text-[15px]">
                          {aiInsight}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-4">
                        Click the sparkles icon to get AI Executive Analysis
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Last updated: {metrics.lastUpdated} • Powered by Master Ledger + AI Analysis
      </p>
    </div>
  );
}