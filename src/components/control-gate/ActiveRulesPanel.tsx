'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react';
import { useActiveTenant } from '@/hooks/useActiveTenant';
import { ensureReconciliationRules } from '@/lib/reconciliation/rulesApi';
import { fetchPendingRuleChanges } from '@/lib/reconciliation/ruleChangesApi';
import { RULE_CATEGORIES, type ReconciliationRuleRecord } from '@/lib/reconciliation/rulesCatalog';

export default function ActiveRulesPanel() {
  const { tenantId, isReady } = useActiveTenant();
  const [rules, setRules] = useState<ReconciliationRuleRecord[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isReady || !tenantId) return;
    (async () => {
      setLoading(true);
      try {
        const [catalog, pending] = await Promise.all([
          ensureReconciliationRules(tenantId),
          fetchPendingRuleChanges(tenantId),
        ]);
        setRules(catalog);
        setPendingCount(pending.length);
      } finally {
        setLoading(false);
      }
    })();
  }, [isReady, tenantId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {rules.filter((r) => r.active).length} of {rules.length} rules active
          {pendingCount > 0 && ` · ${pendingCount} change(s) pending approval`}
        </p>
        <Button variant="outline" asChild>
          <Link href="/settings/rules">
            <ExternalLink className="h-4 w-4 mr-2" />
            Edit in Settings
          </Link>
        </Button>
      </div>

      {RULE_CATEGORIES.map((cat) => {
        const group = rules.filter((r) => r.category === cat.id);
        return (
          <Card key={cat.id}>
            <CardHeader>
              <CardTitle className="text-lg">{cat.label}</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {group.map((rule) => (
                <div key={rule.id ?? rule.rule_code} className="rounded-xl border p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{rule.name}</span>
                    {rule.active ? (
                      <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Off</Badge>
                    )}
                    <Badge variant="outline">v{rule.version ?? 1}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-mono">{rule.rule_code}</p>
                  <p className="text-sm text-slate-600 mt-2">{rule.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}