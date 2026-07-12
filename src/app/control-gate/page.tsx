'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import { fetchPendingRuleChanges } from '@/lib/reconciliation/ruleChangesApi';
import RuleApprovalPanel from '@/components/control-gate/RuleApprovalPanel';
import ActiveRulesPanel from '@/components/control-gate/ActiveRulesPanel';
import IngestMonitoringPanel from '@/components/control-gate/IngestMonitoringPanel';

const tabs = [
  { id: 'monitoring', label: 'Monitoring (Overview)' },
  { id: 'approval', label: 'Approval Workflow' },
  { id: 'active-rules', label: 'Active Rules' },
  { id: 'reports', label: 'Reports' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function ControlGatePage() {
  const { tenantId, isReady } = useActiveTenant();
  const [activeTab, setActiveTab] = useState<TabId>('approval');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isReady || !tenantId) return;
    fetchPendingRuleChanges(tenantId)
      .then((rows) => setPendingCount(rows.length))
      .catch(() => setPendingCount(0));
  }, [isReady, tenantId, activeTab]);

  const generateAuditReport = async (reportType: string) => {
    setIsGeneratingReport(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-audit-report', {
        body: { tenant_id: tenantId, report_type: reportType },
      });

      if (error) throw error;
      if (!data?.html) throw new Error('No HTML content returned from Edge Function');

      const win = window.open('', '_blank');
      if (win) {
        win.document.write(data.html);
        win.document.close();
      } else {
        toast.error('Popup blocked. Please allow popups for the report.');
      }

      toast.success(`${reportType.replace(/_/g, ' ')} generated`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold">Control Gate</h1>
            <p className="text-muted-foreground">Governance · Rule approvals · Compliance · Reports</p>
          </div>
        </div>

        <div className="flex gap-3 mb-10 flex-wrap justify-center">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id)}
              className="px-6 py-5 text-base font-medium relative"
            >
              {tab.label}
              {tab.id === 'approval' && pendingCount > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 text-white text-xs px-1">
                  {pendingCount}
                </span>
              )}
            </Button>
          ))}
        </div>

        {activeTab === 'reports' && (
          <Card>
            <CardHeader>
              <CardTitle>Financial &amp; Audit Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Revenue Recovery Summary', type: 'revenue_recovery_summary' },
                  { name: 'Product Performance & Leakage', type: 'product_performance' },
                  { name: 'Back Audit Findings', type: 'back_audit_findings' },
                  { name: 'Net Revenue Recovery', type: 'net_revenue_recovery' },
                  { name: 'Loss Category Analysis', type: 'loss_category_analysis' },
                ].map((report) => (
                  <Card key={report.type}>
                    <CardContent className="p-6">
                      <h4 className="font-semibold text-lg mb-4">{report.name}</h4>
                      <Button
                        onClick={() => generateAuditReport(report.type)}
                        disabled={isGeneratingReport}
                        className="w-full"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {isGeneratingReport ? 'Generating…' : 'Generate report'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Pending rule approvals</p>
                  <p className="text-5xl font-bold text-amber-600">{pendingCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Workflow</p>
                  <p className="text-lg font-semibold text-emerald-600">Auditor → Approver</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Catalog rules</p>
                  <p className="text-5xl font-bold">21</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground">Automation</p>
                  <p className="text-lg font-semibold">API + schedules</p>
                </CardContent>
              </Card>
            </div>
            <IngestMonitoringPanel />
          </div>
        )}

        {activeTab === 'approval' && <RuleApprovalPanel />}

        {activeTab === 'active-rules' && <ActiveRulesPanel />}
      </div>
    </div>
  );
}