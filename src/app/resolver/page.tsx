'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, AlertTriangle, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { invokeTenantFunction } from '@/lib/edgeFunctions';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import { toast } from 'sonner';

interface Issue {
  id: string;
  type: 'anomaly' | 'reconciliation';
  title: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  status: string;
  created_at: string;
}

export default function ResolverDashboard() {
  const { tenantId, isReady } = useActiveTenant();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'anomaly' | 'reconciliation'>('all');
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [resolutions, setResolutions] = useState<Record<string, string>>({});

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const { data: anomalies, error } = await supabase
        .from('anomalies')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      const formatted = (anomalies || []).map((a: any) => ({
        id: a.id,
        type: 'anomaly' as const,
        title: a.anomaly_id || 'Unknown Issue',
        description: a.description || a.type || 'No description',
        severity: a.severity || 'Medium',
        status: a.status || 'Open',
        created_at: a.created_at
      }));

      setIssues(formatted);
    } catch (err) {
      toast.error("Failed to load issues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady) fetchIssues();
  }, [tenantId, isReady]);

  const resolveWithAI = async (issue: Issue) => {
    setAiLoading(prev => ({ ...prev, [issue.id]: true }));

    try {
      const { data, error } = await invokeTenantFunction<{ analysis: string }>(
        'ai-insight',
        { anomaly: issue, metric_type: 'auto_resolution' },
        tenantId,
      );

      if (error) throw error;
      if (!data?.analysis) throw new Error('No analysis returned');

      setResolutions(prev => ({ ...prev, [issue.id]: data.analysis }));
      toast.success("AI Resolution generated successfully!");
    } catch (err) {
      toast.error("AI resolution failed");
    } finally {
      setAiLoading(prev => ({ ...prev, [issue.id]: false }));
    }
  };

  const filteredIssues = filter === 'all' 
    ? issues 
    : issues.filter(i => i.type === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/60 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Premium Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <Target className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold tracking-tighter text-slate-900">AI Resolver Center</h1>
              <p className="text-xl text-emerald-700 font-medium">Intelligent Issue Resolution Hub</p>
            </div>
          </div>

          <Button onClick={fetchIssues} variant="outline" className="border-slate-300">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh Issues
          </Button>
        </div>

        {/* KPI Summary - Premium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-slate-600">Total Active Issues</p>
              <p className="text-5xl font-bold text-slate-900 mt-3">{issues.length}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-slate-600">High Severity</p>
              <p className="text-5xl font-bold text-red-600 mt-3">
                {issues.filter(i => i.severity === 'High').length}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-slate-600">AI Resolutions</p>
              <p className="text-5xl font-bold text-emerald-600 mt-3">{Object.keys(resolutions).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 border-b pb-6">
          <Button 
            variant={filter === 'all' ? "default" : "outline"} 
            onClick={() => setFilter('all')}
            className="px-8"
          >
            All Issues
          </Button>
          <Button 
            variant={filter === 'anomaly' ? "default" : "outline"} 
            onClick={() => setFilter('anomaly')}
            className="px-8"
          >
            Anomalies
          </Button>
          <Button 
            variant={filter === 'reconciliation' ? "default" : "outline"} 
            onClick={() => setFilter('reconciliation')}
            className="px-8"
          >
            Reconciliation
          </Button>
        </div>

        {/* Issues List */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-2xl">
              {filter === 'all' && 'All Active Issues'}
              {filter === 'anomaly' && 'Anomaly Issues'}
              {filter === 'reconciliation' && 'Reconciliation Issues'}
              {' '}({filteredIssues.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredIssues.length === 0 ? (
              <p className="text-center py-20 text-slate-500">No issues found in this category.</p>
            ) : (
              <div className="space-y-6">
                {filteredIssues.map((issue) => (
                  <div key={issue.id} className="border rounded-3xl p-8 hover:shadow-lg transition-all bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <Badge variant={issue.severity === 'High' ? "destructive" : "secondary"}>
                            {issue.severity}
                          </Badge>
                          <span className="font-semibold text-xl">{issue.title}</span>
                        </div>
                        <p className="mt-5 text-slate-700 leading-relaxed text-lg">{issue.description}</p>
                      </div>

                      <Button 
                        onClick={() => resolveWithAI(issue)}
                        disabled={aiLoading[issue.id]}
                        className="bg-emerald-600 hover:bg-emerald-700 min-w-[220px] py-6 text-lg"
                      >
                        <Sparkles className="mr-3 h-5 w-5" />
                        {aiLoading[issue.id] ? "Analyzing..." : "Resolve with AI"}
                      </Button>
                    </div>

                    {resolutions[issue.id] && (
                      <div className="mt-10 bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-emerald-800 leading-relaxed">
                        <strong>🤖 AI Resolution:</strong>
                        <div className="mt-4 whitespace-pre-line">
                          {resolutions[issue.id]}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}