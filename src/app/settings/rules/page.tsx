'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit2, ExternalLink, Loader2, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useRuleEngine } from '@/contexts/RuleEngineContext';
import {
  CONFIG_FIELD_HINTS,
  RULE_CATEGORIES,
  type ReconciliationRuleRecord,
  type RuleCategory,
} from '@/lib/reconciliation/rulesCatalog';

export default function RulesManagement() {
  const {
    rules,
    loading,
    canEdit,
    canDirectPublish,
    canReset,
    pendingByRuleId,
    saveRuleChange,
    toggleRule,
    resetToDefaults,
    refreshRules,
  } = useRuleEngine();

  const [activeTab, setActiveTab] = useState<RuleCategory>('matching');
  const [editingRule, setEditingRule] = useState<ReconciliationRuleRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    active: true,
    config: {} as Record<string, unknown>,
  });

  const openEdit = (rule: ReconciliationRuleRecord) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      description: rule.description,
      active: rule.active,
      config: { ...rule.config },
    });
  };

  const saveEdit = async (direct = false) => {
    if (!editingRule?.id) return;
    setSaving(true);
    try {
      const result = await saveRuleChange(
        editingRule.id,
        {
          name: form.name,
          description: form.description,
          active: form.active,
          config: form.config,
        },
        { direct },
      );
      if (result === 'published') {
        toast.success('Rule published — active on next reconciliation run');
      } else {
        toast.success('Change submitted for approval', {
          description: 'Review in Control Gate → Approval Workflow',
        });
      }
      setEditingRule(null);
      await refreshRules();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (ruleId: string) => {
    try {
      const result = await toggleRule(ruleId);
      if (result === 'proposed') {
        toast.info('Toggle submitted for approval in Control Gate');
      } else {
        toast.success('Rule updated');
      }
      await refreshRules();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update rule');
    }
  };

  const handleReset = async () => {
    if (!canReset) {
      toast.error('Only admins can reset rules to defaults');
      return;
    }
    try {
      await resetToDefaults();
      toast.success('All 17 rules restored to defaults');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Reset failed');
    }
  };

  const configFields = editingRule
    ? CONFIG_FIELD_HINTS[editingRule.rule_code] ?? []
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Reconciliation Rules</h1>
          <p className="text-slate-600 mt-1">
            Propose changes here — approvers publish via{' '}
            <Link href="/control-gate" className="text-emerald-600 underline">
              Control Gate
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" asChild>
            <Link href="/control-gate">
              <ExternalLink className="h-4 w-4 mr-2" />
              Approval queue
            </Link>
          </Button>
          <Button variant="outline" onClick={() => refreshRules()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
          </Button>
          {canReset && (
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw size={18} /> Reset defaults
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RuleCategory)}>
        <TabsList className="grid w-full grid-cols-4">
          {RULE_CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {RULE_CATEGORIES.map((cat) => (
          <TabsContent key={cat.id} value={cat.id}>
            <Card className="fin-card">
              <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                <h2 className="font-semibold text-lg">
                  {cat.label} ({rules.filter((r) => r.category === cat.id && r.active).length} active)
                </h2>
                {!canEdit && (
                  <Badge variant="secondary">View only — auditor role required to edit</Badge>
                )}
              </div>

              <div className="divide-y">
                {loading && (
                  <div className="p-8 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading rules…
                  </div>
                )}

                {!loading && rules.filter((r) => r.category === cat.id).length === 0 && (
                  <div className="p-8 text-center text-slate-500">No rules in this category.</div>
                )}

                {!loading &&
                  rules.filter((r) => r.category === cat.id).map((rule) => (
                    <div
                      key={rule.id ?? rule.rule_code}
                      className="p-6 flex items-center justify-between hover:bg-slate-50 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-lg">{rule.name}</h3>
                          <Badge variant="outline" className="font-mono text-xs">
                            {rule.rule_code}
                          </Badge>
                          {rule.active ? (
                            <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Disabled</Badge>
                          )}
                          <Badge variant="outline">v{rule.version ?? 1}</Badge>
                          {rule.id && pendingByRuleId[rule.id] && (
                            <Badge className="bg-amber-100 text-amber-800">Pending approval</Badge>
                          )}
                        </div>
                        <p className="text-slate-600 mt-1 text-sm">{rule.description}</p>
                        <p className="text-xs text-slate-500 mt-2 font-mono truncate">
                          {JSON.stringify(rule.config)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {canEdit && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => openEdit(rule)}>
                              <Edit2 size={16} />
                            </Button>
                            <Switch
                              checked={rule.active}
                              disabled={!!(rule.id && pendingByRuleId[rule.id])}
                              onCheckedChange={() => handleToggle(rule.id!)}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {editingRule && (
        <div className="fixed inset-0 bg-black/70 z-[300] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold">Edit Rule</h2>
                <p className="text-sm text-slate-500 font-mono mt-1">{editingRule.rule_code}</p>
              </div>

              <div className="space-y-2">
                <Label>Display name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>

              {configFields.length > 0 && (
                <div className="space-y-4 rounded-xl border p-4 bg-slate-50">
                  <p className="font-medium text-sm">Thresholds & config</p>
                  {configFields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label>{field.label}</Label>
                      <Input
                        type={field.type}
                        value={String(form.config[field.key] ?? '')}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            config: {
                              ...form.config,
                              [field.key]:
                                field.type === 'number'
                                  ? parseFloat(e.target.value) || 0
                                  : e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                <span className="font-medium">Rule active</span>
                <Switch
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                />
              </div>
            </div>

            <div className="p-6 border-t flex flex-wrap gap-3 justify-end">
              <Button variant="outline" onClick={() => setEditingRule(null)}>
                Cancel
              </Button>
              <Button onClick={() => saveEdit(false)} disabled={saving} className="accent-btn gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={18} />}
                Submit for approval
              </Button>
              {canDirectPublish && (
                <Button variant="secondary" onClick={() => saveEdit(true)} disabled={saving}>
                  Publish immediately (admin)
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}