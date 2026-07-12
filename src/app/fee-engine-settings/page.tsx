// src/app/fee-engine-settings/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Save, RefreshCw, Plus, Trash2, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/providers";

type FeeTier = {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number | null;
  commissionRate: number;
  vatRate: number;
};

type FeeVersion = {
  id?: string;
  effective_from: string;
  tiers: FeeTier[];
  auto_reconcile: boolean;
  high_value_alert: boolean;
  retry_attempts: number;
  updated_by: string;
  status: "pending" | "approved" | "rejected";
  created_at?: string;
};

export default function FeeEngineSettingsPage() {
  const { profile } = useAuth();

  const [tiers, setTiers] = useState<FeeTier[]>([
    { id: "1", name: "Small", minAmount: 0, maxAmount: 500000, commissionRate: 1.2, vatRate: 7.5 },
    { id: "2", name: "Medium", minAmount: 500001, maxAmount: 5000000, commissionRate: 1.5, vatRate: 7.5 },
    { id: "3", name: "High Value", minAmount: 5000001, maxAmount: null, commissionRate: 1.8, vatRate: 7.5 },
  ]);

  const [autoReconcile, setAutoReconcile] = useState(true);
  const [highValueAlert, setHighValueAlert] = useState(true);
  const [retryAttempts, setRetryAttempts] = useState(3);
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [testAmount, setTestAmount] = useState(1245000);

  const [versions, setVersions] = useState<FeeVersion[]>([]);
  const [saving, setSaving] = useState(false);

  // Live Preview
  const calculateFee = (amount: number) => {
    const tier = tiers.find(t => amount >= t.minAmount && (t.maxAmount === null || amount <= t.maxAmount)) || tiers[0];
    const commission = amount * (tier.commissionRate / 100);
    const vat = commission * (tier.vatRate / 100);
    return { tier: tier.name, commission, vat, totalFee: commission + vat };
  };

  const result = calculateFee(testAmount);

  const saveAsNewVersion = async (status: "pending" | "approved") => {
    setSaving(true);
    try {
      const newVersion: FeeVersion = {
        effective_from: effectiveFrom,
        tiers,
        auto_reconcile: autoReconcile,
        high_value_alert: highValueAlert,
        retry_attempts: retryAttempts,
        updated_by: profile?.full_name || "Admin",
        status,
      };

      // Simulate saving to Supabase (you can connect real tables later)
      setVersions([newVersion, ...versions]);

      toast.success(status === "approved" 
        ? "New Fee Version Approved & Activated" 
        : "Version Submitted for Approval");

    } catch (err) {
      toast.error("Failed to save version");
    } finally {
      setSaving(false);
    }
  };

  const addTier = () => {
    const newTier: FeeTier = {
      id: Date.now().toString(),
      name: `Tier ${tiers.length + 1}`,
      minAmount: tiers[tiers.length - 1]?.maxAmount || 10000000,
      maxAmount: null,
      commissionRate: 1.8,
      vatRate: 7.5,
    };
    setTiers([...tiers, newTier]);
  };

  const removeTier = (id: string) => {
    if (tiers.length === 1) return toast.error("At least one tier required");
    setTiers(tiers.filter(t => t.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Fee Engine Settings</h1>
          <p className="text-slate-600">Versioned • Effective Dating • Approval Workflow</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw size={18} className="mr-2" />
            Reset
          </Button>
          <Button onClick={() => saveAsNewVersion("pending")} variant="outline" disabled={saving}>
            Submit for Approval
          </Button>
          <Button onClick={() => saveAsNewVersion("approved")} disabled={saving}>
            Approve & Activate Now
          </Button>
        </div>
      </div>

      {/* Live Preview */}
      <Card className="fin-card">
        <CardHeader>
          <CardTitle>Live Fee Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="number"
            value={testAmount}
            onChange={(e) => setTestAmount(Number(e.target.value))}
            className="text-4xl font-mono p-8 mb-6"
          />
          <div className="bg-emerald-50 p-8 rounded-3xl">
            <p className="text-emerald-700">Applied Tier → {result.tier}</p>
            <p className="text-6xl font-bold text-emerald-700 mt-4">₦{result.totalFee.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tier Management */}
      <Card className="fin-card">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle>Fee Tiers</CardTitle>
          <Button onClick={addTier}>
            <Plus size={18} className="mr-2" /> Add Tier
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {tiers.map((tier, index) => (
            <div key={tier.id} className="border rounded-2xl p-6 grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
              <div className="md:col-span-2">
                <Label>Tier Name</Label>
                <Input value={tier.name} onChange={(e) => {
                  const updated = [...tiers];
                  updated[index].name = e.target.value;
                  setTiers(updated);
                }} />
              </div>
              <div>
                <Label>Min Amount (₦)</Label>
                <Input type="number" value={tier.minAmount} onChange={(e) => {
                  const updated = [...tiers];
                  updated[index].minAmount = Number(e.target.value);
                  setTiers(updated);
                }} />
              </div>
              <div>
                <Label>Max Amount (₦)</Label>
                <Input type="number" placeholder="No limit" value={tier.maxAmount || ""} onChange={(e) => {
                  const updated = [...tiers];
                  updated[index].maxAmount = e.target.value ? Number(e.target.value) : null;
                  setTiers(updated);
                }} />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label>Commission %</Label>
                  <Input type="number" step="0.1" value={tier.commissionRate} onChange={(e) => {
                    const updated = [...tiers];
                    updated[index].commissionRate = parseFloat(e.target.value);
                    setTiers(updated);
                  }} />
                </div>
                <div className="flex-1">
                  <Label>VAT %</Label>
                  <Input type="number" step="0.1" value={tier.vatRate} onChange={(e) => {
                    const updated = [...tiers];
                    updated[index].vatRate = parseFloat(e.target.value);
                    setTiers(updated);
                  }} />
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeTier(tier.id)} className="text-red-500">
                <Trash2 size={20} />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Version History */}
      <Card className="fin-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Clock className="text-blue-600" /> Version History & Approval Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          {versions.length > 0 ? (
            <div className="space-y-4">
              {versions.map((version, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border">
                  <div>
                    <p className="font-medium">Effective from {new Date(version.effective_from).toLocaleDateString()}</p>
                    <p className="text-sm text-slate-500">by {version.updated_by}</p>
                  </div>
                  <Badge variant={version.status === "approved" ? "default" : "secondary"}>
                    {version.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-12 text-slate-500">No previous versions yet. Save a new version above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}