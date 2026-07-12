'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import { fetchPendingRuleChanges } from '@/lib/reconciliation/ruleChangesApi';
import RuleApprovalPanel from '@/components/control-gate/RuleApprovalPanel';
import ActiveRulesPanel from '@/components/control-gate/ActiveRulesPanel';

const tabs = [
  { id: 'active-rules', label: 'Active Rules' },
  { id: 'approval', label: 'Approval Workflow' },
  { id: 'reports', label: 'Reports' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export default function ControlGatePage() {
  const { tenantId, isReady } = useActiveTenant();
  const [activeTab, setActiveTab] = useState<TabId>('active-rules');
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
        body: {
          tenant_id: tenantId,
          report_type: reportType,
        },
      });

      if (error) throw error;

      const win = window.open('', '_blank');
      if (win) {
        win.document.write(data.html);
        win.document.close();
      }

      toast.success(`✅ ${reportType.replace(/_/g, ' ')} Generated`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-bold">Control Gate</h1>
          <p className="text-muted-foreground">Governance • Risk • Compliance</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/settings/rules">
            <ExternalLink className="mr-2 h-4 w-4" />
            Edit rules in Settings
          </Link>
        </Button>
      </div>

      <div className="flex gap-2 border-b flex-wrap">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab.id)}
            className="relative"
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

      {activeTab === 'active-rules' && <ActiveRulesPanel />}

      {activeTab === 'approval' && <RuleApprovalPanel />}

      {activeTab === 'reports' && (
        <Card>
          <CardHeader>
            <CardTitle>Financial &amp; Audit Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Revenue Recovery Summary', type: 'revenue_recovery_summary' },
                { name: 'Product Performance', type: 'product_performance' },
                { name: 'Back Audit Findings', type: 'back_audit_findings' },
                { name: 'Net Revenue Recovery', type: 'net_revenue_recovery' },
                { name: 'Loss Category Analysis', type: 'loss_category_analysis' },
              ].map((report) => (
                <Card key={report.type} className="hover:shadow-md transition">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-lg">{report.name}</h4>
                    <Button
                      onClick={() => generateAuditReport(report.type)}
                      disabled={isGeneratingReport}
                      className="w-full mt-6"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {isGeneratingReport ? 'Generating...' : 'Download PDF'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}