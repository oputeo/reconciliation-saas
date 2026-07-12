'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Zap, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useActiveTenant } from '@/hooks/useActiveTenant';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface Props {
  startDate?: string;
  endDate?: string;
}

export default function ForecastPage({ startDate = "2025-01-01", endDate = "2026-06-02" }: Props) {
  const { tenantId } = useActiveTenant();
  const [forecastPeriod, setForecastPeriod] = useState<"3" | "6">("3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [forecastData, setForecastData] = useState<any>(null);

  const generateForecast = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-forecast', {
        body: {
          tenant_id: tenantId,
          months: parseInt(forecastPeriod),
          start_date: startDate,
          end_date: endDate,
        }
      });

      if (error) throw error;

      setForecastData(data);
      toast.success(`✅ ${forecastPeriod}-Month Forecast Generated`, {
        description: "Based on historical trends + seasonality"
      });
    } catch (err: any) {
      toast.error("Forecast failed", { description: err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Revenue Forecast Engine</h1>
          <p className="text-muted-foreground">AI-Powered Business Projection • 3 & 6 Months</p>
        </div>
        <Badge variant="outline" className="text-emerald-600">Production Ready</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate New Forecast</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-6 items-end">
          <div>
            <label className="text-sm font-medium block mb-2">Forecast Period</label>
            <Select value={forecastPeriod} onValueChange={(v) => setForecastPeriod(v as '3' | '6')}>
              <SelectTrigger className="w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Next 3 Months</SelectItem>
                <SelectItem value="6">Next 6 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={generateForecast} disabled={isGenerating} size="lg">
            {isGenerating ? (
              <><RefreshCw className="mr-3 h-5 w-5 animate-spin" /> Generating...</>
            ) : (
              <><Zap className="mr-3 h-5 w-5" /> Generate Forecast</>
            )}
          </Button>
        </CardContent>
      </Card>

      {forecastData && (
        <Card>
          <CardHeader>
            <CardTitle>{forecastPeriod}-Month Revenue Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={forecastData.forecast_series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `₦${(v/1000000).toFixed(1)}M`} />
                <Tooltip formatter={(v) => `₦${Number(v ?? 0).toLocaleString()}`} />
                <Line 
                  type="natural" 
                  dataKey="projected" 
                  stroke="#10b981" 
                  strokeWidth={5} 
                  dot={{ r: 6 }}
                  name="Projected"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}