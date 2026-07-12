'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, Calendar, Download, RefreshCw, Target, Zap 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useActiveTenant } from '@/hooks/useActiveTenant';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

export default function ForecastPage() {
  const { tenantId, isReady } = useActiveTenant();
  const [forecastPeriod, setForecastPeriod] = useState<"3" | "6">("3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [forecastData, setForecastData] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  const generateForecast = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-forecast', {
        body: {
          tenant_id: tenantId,
          months: parseInt(forecastPeriod),
          include_confidence: true
        }
      });

      if (error) throw error;

      setForecastData(data);
      toast.success(`✅ ${forecastPeriod}-Month Forecast Generated`, {
        description: "Based on historical trends + seasonality"
      });

    } catch (err: any) {
      console.error(err);
      toast.error("Forecast generation failed", { description: err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  // Load historical data for chart
  useEffect(() => {
    const loadHistorical = async () => {
      const { data } = await supabase
        .from('revenue_recovery_summary')
        .select('month, revenue, recovered_amount')
        .eq('tenant_id', tenantId)
        .order('month', { ascending: true });

      setHistoricalData(data || []);
    };
    if (isReady) loadHistorical();
  }, [tenantId, isReady]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-bold">Revenue Forecast</h1>
            <p className="text-xl text-muted-foreground mt-2">
              AI-Powered 3 & 6 Month Business Forecasting • Commercial Grade
            </p>
          </div>
          <Badge variant="outline" className="text-emerald-600">Live Production Mode</Badge>
        </div>

        {/* Controls */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle>Generate Forecast</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6 items-end">
            <div>
              <label className="text-sm font-medium">Forecast Period</label>
              <Select value={forecastPeriod} onValueChange={(v: any) => setForecastPeriod(v)}>
                <SelectTrigger className="w-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Next 3 Months</SelectItem>
                  <SelectItem value="6">Next 6 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={generateForecast} 
              disabled={isGenerating}
              size="lg"
              className="px-10"
            >
              {isGenerating ? (
                <><RefreshCw className="mr-3 h-5 w-5 animate-spin" /> Generating Forecast...</>
              ) : (
                <><Zap className="mr-3 h-5 w-5" /> Generate {forecastPeriod}-Month Forecast</>
              )}
            </Button>
          </CardContent>
        </Card>

        {forecastData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <Card>
                <CardContent className="p-8">
                  <p className="text-sm text-muted-foreground">Projected Revenue</p>
                  <p className="text-5xl font-bold mt-3">
                    ₦{forecastData.projected_revenue?.toLocaleString()}
                  </p>
                  <p className="text-emerald-600 text-sm mt-2">
                    +{forecastData.growth_rate}% vs last period
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <p className="text-sm text-muted-foreground">Expected Recovery</p>
                  <p className="text-5xl font-bold mt-3 text-emerald-600">
                    ₦{forecastData.expected_recovery?.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <p className="text-sm text-muted-foreground">Confidence Interval</p>
                  <p className="text-5xl font-bold mt-3">
                    {forecastData.confidence_interval}%
                  </p>
                  <p className="text-amber-600 text-sm mt-2">Model Confidence</p>
                </CardContent>
              </Card>
            </div>

            {/* Forecast Chart */}
            <Card className="mb-10">
              <CardHeader>
                <CardTitle>{forecastPeriod}-Month Revenue Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={420}>
                  <LineChart data={forecastData.forecast_series}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(v) => `₦${Number(v ?? 0).toLocaleString()}`} />
                    <Line 
                      type="natural" 
                      dataKey="projected" 
                      stroke="#10b981" 
                      strokeWidth={4} 
                      dot={{ r: 6 }}
                      name="Projected Revenue"
                    />
                    <Line 
                      type="natural" 
                      dataKey="historical" 
                      stroke="#64748b" 
                      strokeDasharray="5 5"
                      name="Historical"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        {/* Historical Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Historical Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                <Bar dataKey="recovered_amount" fill="#10b981" name="Recovered" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}