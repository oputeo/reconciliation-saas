'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, BarChart3, TrendingUp, Clock, ShieldCheck, PieChart, Bug } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import ReconFlowReport from './ReconFlowReport';
import ForecastPage from './ForecastPage';
import ProductAuditDashboard from './ProductAuditDashboard';
import BackAuditPage from './BackAuditPage';
import ControlGatePage from './ControlGatePage';

const navigation = [
  { id: 'overview', label: 'Executive Overview', icon: BarChart3 },
  { id: 'forecast', label: 'Revenue Forecast', icon: TrendingUp },
  { id: 'products', label: 'Product Audit', icon: PieChart },
  { id: 'back-audit', label: 'Back Audit', icon: Clock },
  { id: 'control-gate', label: 'Control Gate', icon: ShieldCheck },
];

function ExecutiveDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlTab = searchParams.get('tab') as keyof typeof navigationMap | null;

  const navigationMap: Record<string, React.ComponentType<any>> = {
    overview: ReconFlowReport,
    forecast: ForecastPage,
    products: ProductAuditDashboard,
    'back-audit': BackAuditPage,
    'control-gate': ControlGatePage,
  };

  const [activeSection, setActiveSection] = useState<keyof typeof navigationMap>(
    (urlTab && navigationMap[urlTab]) ? urlTab : 'overview'
  );

  const [globalStartDate, setGlobalStartDate] = useState("2025-01-01");
  const [globalEndDate, setGlobalEndDate] = useState("2026-06-02");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab && navigationMap[currentTab]) {
      setActiveSection(currentTab as keyof typeof navigationMap);
    }
  }, [searchParams]);

  const updateTab = (tab: keyof typeof navigationMap) => {
    setActiveSection(tab);
    router.push(`/executive?tab=${tab}`, { scroll: false });
  };

  const exportToPDF = async () => {
    setExporting(true);
    toast.info("Generating professional PDF report...");
    try {
      const element = document.getElementById('report-content') as HTMLElement;
      if (!element) return toast.error("Content not found");

      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`ReconFlow_Executive_Report_${new Date().toISOString().slice(0,10)}.pdf`);

      toast.success("PDF exported successfully!");
    } catch (err) {
      toast.error("Failed to generate PDF");
    } finally {
      setExporting(false);
    }
  };

  const testSentryError = () => {
    toast.info("Triggering Sentry test...");
    throw new Error("🧪 Test Error - Sentry Monitoring is Active");
  };

  const CurrentComponent = navigationMap[activeSection];

  return (
    <div className="min-h-full w-full min-w-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/60">
      <div className="w-full min-w-0 max-w-7xl mx-auto">
        {/* Premium Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10 lg:mb-12">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl flex items-center justify-center shadow-2xl ring-1 ring-emerald-400/30">
              <span className="text-white text-3xl sm:text-5xl font-bold tracking-tighter">R</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter text-slate-900 truncate">ReconFlow</h1>
              <p className="text-base sm:text-xl lg:text-2xl text-emerald-700 font-medium tracking-tight">Revenue Assurance Intelligence</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full lg:w-auto">
            <Button variant="outline" onClick={() => window.location.reload()} className="border-slate-300">
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>

            <Button onClick={testSentryError} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
              <Bug className="mr-2 h-4 w-4" /> Test Sentry
            </Button>

            <Button 
              onClick={exportToPDF} 
              disabled={exporting} 
              className="bg-emerald-700 hover:bg-emerald-800 px-8 font-semibold shadow-lg shadow-emerald-200"
            >
              <Download className="mr-2 h-4 w-4" />
              {exporting ? "Exporting Report..." : "Export PDF"}
            </Button>
          </div>
        </div>

        {/* Global Date Filter - Premium */}
        <div className="mb-10 lg:mb-12 bg-white/90 backdrop-blur-2xl border border-slate-100 rounded-3xl p-4 sm:p-6 lg:p-8 shadow flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-4 sm:gap-6 lg:gap-8">
          <div className="font-semibold text-emerald-700 text-base sm:text-lg shrink-0">Analysis Period</div>
          <input 
            type="date" 
            value={globalStartDate} 
            onChange={(e) => setGlobalStartDate(e.target.value)} 
            className="border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 text-lg"
          />
          <span className="text-2xl text-slate-300">→</span>
          <input 
            type="date" 
            value={globalEndDate} 
            onChange={(e) => setGlobalEndDate(e.target.value)} 
            className="border border-slate-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500 text-lg"
          />
        </div>

        {/* Navigation Tabs - Premium Style */}
        <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-xl border mb-10 lg:mb-12">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <Button
                  key={item.id}
                  onClick={() => updateTab(item.id as any)}
                  className={`flex-1 min-w-[140px] sm:min-w-[170px] py-5 sm:py-8 rounded-2xl font-semibold text-sm sm:text-lg transition-all duration-300 ${isActive 
                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/30 scale-[1.02]' 
                    : 'hover:bg-slate-100 text-slate-700 hover:text-emerald-700'}`}
                >
                  <Icon className={`mr-4 h-6 w-6 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div 
          id="report-content" 
          className="min-h-[60vh] w-full min-w-0 bg-white rounded-3xl p-4 sm:p-8 lg:p-12 shadow-2xl border border-slate-100"
        >
          <CurrentComponent startDate={globalStartDate} endDate={globalEndDate} />
        </div>
      </div>
    </div>
  );
}

export default function ExecutiveDashboardWrapper() {
  return (
    <Suspense fallback={<div className="p-12">Loading executive dashboard...</div>}>
      <ExecutiveDashboard />
    </Suspense>
  );
}