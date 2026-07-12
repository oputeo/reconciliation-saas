'use client';

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RefreshCw, Sparkles, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useAuth } from "@/app/providers";
import { useActiveTenant } from "@/hooks/useActiveTenant";
import { supabase } from "@/lib/supabase";
import { invokeTenantFunction } from "@/lib/edgeFunctions";
import { channelFromAnomaly } from "@/lib/channelInference";
import { toast } from "sonner";

interface Anomaly {
  id: string;
  anomaly_id: string;
  date: string;
  bank?: string;
  product_type?: string;
  type: string;
  variance: number;
  severity: "High" | "Medium" | "Low";
  status: "Open" | "Investigating" | "Resolved";
  description: string;
  root_cause?: string;
  notes?: string;
  created_at: string;
}

export default function AnomaliesPage() {
  const { hasPermission } = useAuth();
  const { tenantId, isReady } = useActiveTenant();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [productFilter, setProductFilter] = useState("All");

  const formatProduct = (value?: string | null) => {
    if (!value) return "—";
    return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const anomalyTypes = [...new Set(anomalies.map((a) => a.type).filter(Boolean))].sort();
  const anomalyProducts = [...new Set(anomalies.map((a) => a.product_type).filter(Boolean))].sort() as string[];
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [aiResolution, setAiResolution] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [rootCause, setRootCause] = useState<Record<string, string>>({});

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('anomalies')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnomalies(data || []);
    } catch (err) {
      toast.error("Failed to load anomalies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady) fetchAnomalies();
  }, [tenantId, isReady]);

  const toggleExpand = (anomaly: Anomaly) => {
    const newSet = new Set(expandedRows);
    const opening = !newSet.has(anomaly.id);
    newSet.has(anomaly.id) ? newSet.delete(anomaly.id) : newSet.add(anomaly.id);
    setExpandedRows(newSet);

    if (opening) {
      setRootCause((prev) => (
        prev[anomaly.id] ? prev : { ...prev, [anomaly.id]: anomaly.root_cause || "" }
      ));
      setNotes((prev) => (
        prev[anomaly.id] ? prev : { ...prev, [anomaly.id]: anomaly.notes || "" }
      ));
    }
  };

  const resolveWithAI = async (anomaly: Anomaly) => {
    setAiLoading(prev => ({ ...prev, [anomaly.id]: true }));

    try {
      const { data, error } = await invokeTenantFunction<{ analysis: string }>(
        'ai-insight',
        { anomaly },
        tenantId,
      );

      if (error) throw error;
      if (!data?.analysis) throw new Error('No analysis returned');

      setAiResolution(prev => ({ ...prev, [anomaly.id]: data.analysis }));

      const rootLine = data.analysis.match(/\*\*Root Cause:\*\*\s*(.+)/i)?.[1]?.trim();
      if (rootLine) {
        setRootCause(prev => ({ ...prev, [anomaly.id]: rootLine }));
      } else if (anomaly.root_cause) {
        setRootCause(prev => ({ ...prev, [anomaly.id]: anomaly.root_cause || "" }));
      }

      toast.success("AI Resolution generated!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI service temporarily busy. Please try again.";
      toast.error(message);
    } finally {
      setAiLoading(prev => ({ ...prev, [anomaly.id]: false }));
    }
  };

  const saveInvestigation = async (anomalyId: string) => {
    try {
      const { error } = await supabase
        .from('anomalies')
        .update({
          notes: notes[anomalyId] || '',
          root_cause: rootCause[anomalyId] || '',
          status: "Investigating"
        })
        .eq('id', anomalyId);

      if (error) throw error;

      toast.success("Investigation saved successfully");
      fetchAnomalies();
    } catch (err) {
      toast.error("Failed to save investigation");
    }
  };

  const markAsResolved = async (anomalyId: string) => {
    if (!confirm("Mark this anomaly as Resolved?")) return;

    try {
      const { error } = await supabase
        .from('anomalies')
        .update({ status: "Resolved" })
        .eq('id', anomalyId);

      if (error) throw error;
      toast.success("Anomaly marked as Resolved");
      fetchAnomalies();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const filteredAnomalies = anomalies.filter(a => {
    const searchMatch = (a.anomaly_id + a.description + (a.bank || "")).toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === "All" || a.status === statusFilter;
    const severityMatch = severityFilter === "All" || a.severity === severityFilter;
    const typeMatch = typeFilter === "All" || a.type === typeFilter;
    const productMatch = productFilter === "All" || a.product_type === productFilter;
    return searchMatch && statusMatch && severityMatch && typeMatch && productMatch;
  });

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Anomalies & Alerts</h1>
        <Button onClick={fetchAnomalies} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Total Anomalies</p>
            <p className="text-4xl font-bold">{anomalies.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Open</p>
            <p className="text-4xl font-bold text-orange-600">
              {anomalies.filter(a => a.status !== "Resolved").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">High Severity</p>
            <p className="text-4xl font-bold text-red-600">
              {anomalies.filter(a => a.severity === "High").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600">Total Variance</p>
            <p className="text-4xl font-bold text-emerald-600">
              ₦{anomalies.reduce((sum, a) => sum + (a.variance || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Input 
              placeholder="Search anomalies..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Investigating">Investigating</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Severity</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-52"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                {anomalyTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="All Products" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Products</SelectItem>
                {anomalyProducts.map((p) => (
                  <SelectItem key={p} value={p}>{formatProduct(p)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anomaly ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAnomalies.map((anomaly) => {
                const isExpanded = expandedRows.has(anomaly.id);
                const resolution = aiResolution[anomaly.id];

                return (
                  <React.Fragment key={anomaly.id}>
                    <TableRow className="hover:bg-slate-50 cursor-pointer" onClick={() => toggleExpand(anomaly)}>
                      <TableCell className="font-mono">{anomaly.anomaly_id}</TableCell>
                      <TableCell>{anomaly.date}</TableCell>
                      <TableCell>{channelFromAnomaly(anomaly)}</TableCell>
                      <TableCell>{formatProduct(anomaly.product_type)}</TableCell>
                      <TableCell>{anomaly.type}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        ₦{anomaly.variance.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={anomaly.severity === "High" ? "destructive" : "secondary"}>
                          {anomaly.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={anomaly.status === "Resolved" ? "default" : "secondary"}>
                          {anomaly.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={9} className="bg-slate-50 p-8">
                          <div className="bg-white rounded-2xl p-8 border space-y-8">
                            <h3 className="font-semibold text-lg">Investigation & AI Resolution</h3>

                            <Button 
                              onClick={() => resolveWithAI(anomaly)} 
                              disabled={aiLoading[anomaly.id]}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              {aiLoading[anomaly.id] ? "Analyzing..." : "Resolve with AI"}
                            </Button>

                            {resolution && (
                              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-emerald-800 whitespace-pre-line">
                                {resolution}
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <Label>Root Cause</Label>
                                <Input 
                                  value={rootCause[anomaly.id] || ""} 
                                  onChange={(e) => setRootCause(prev => ({ ...prev, [anomaly.id]: e.target.value }))} 
                                  placeholder="e.g., Timing mismatch or duplicate posting" 
                                />
                              </div>
                              <div>
                                <Label>Investigation Notes</Label>
                                <Textarea 
                                  value={notes[anomaly.id] || ""} 
                                  onChange={(e) => setNotes(prev => ({ ...prev, [anomaly.id]: e.target.value }))} 
                                  rows={4} 
                                  placeholder="Document your findings and actions..." 
                                />
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <Button onClick={() => saveInvestigation(anomaly.id)}>Save Investigation</Button>
                              {hasPermission && hasPermission('finance') && (
                                <Button variant="default" onClick={() => markAsResolved(anomaly.id)}>
                                  Mark as Resolved
                                </Button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}