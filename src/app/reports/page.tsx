// src/app/reports/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import Sidebar from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Download, FileText, Eye, AlertTriangle } from "lucide-react";
import PowerBIEmbedComponent from "@/components/PowerBIEmbed";
import jsPDF from "jspdf";

type Report = {
  id: string;
  name: string;
  type: string;
  date: string;
  status: string;
  size: string;
  category: string;
};

const reports: Report[] = [
  { id: "RPT-4561", name: "CBN Daily Reconciliation Summary", type: "Regulatory", date: "2026-05-15", status: "Ready", size: "2.4 MB", category: "Regulatory" },
  { id: "RPT-4560", name: "NIBSS Settlement Report", type: "Settlement", date: "2026-05-15", status: "Ready", size: "1.8 MB", category: "Settlement" },
  { id: "RPT-4559", name: "Wallet vs Core Banking Reconciliation", type: "Internal", date: "2026-05-14", status: "Generated", size: "3.1 MB", category: "Internal" },
  { id: "RPT-4558", name: "Anomaly & Fraud Intelligence Report", type: "Compliance", date: "2026-05-14", status: "Pending", size: "890 KB", category: "Compliance" },
];

export default function ReportsPage() {
  const router = useRouter();
  const { currentUser } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [showPowerBI, setShowPowerBI] = useState(false);

  const allowedRoles = ["System Administrator", "Senior Reconciliation Officer", "Finance Approver", "Auditor"];

  useEffect(() => {
    if (!allowedRoles.includes(currentUser.role)) {
      alert("⛔ Access Denied: Only authorized roles can access Reports & Exports.");
      router.push("/");
    }
  }, [currentUser.role, router]);

  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-slate-600 mt-2">You don't have permission to view Reports & Exports.</p>
          <Button className="mt-6" onClick={() => router.push("/")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "All" || report.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || report.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const exportToPDF = (report: Report) => {
    setExportingId(report.id);
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("ReconFlow", 20, 20);
    doc.setFontSize(16);
    doc.text(report.name, 20, 35);

    doc.setFontSize(12);
    doc.text(`Type: ${report.type}`, 20, 50);
    doc.text(`Date: ${report.date}`, 20, 58);
    doc.text(`Status: ${report.status}`, 20, 66);

    doc.save(`${report.name.replace(/\s+/g, '_')}.pdf`);
    setTimeout(() => setExportingId(null), 1000);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
              <p className="text-slate-600 dark:text-slate-400">CBN • Power BI • Professional Exports</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowPowerBI(!showPowerBI)}>
                {showPowerBI ? "Hide Power BI" : "Open Power BI Dashboard"}
              </Button>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Create Custom Report
              </Button>
            </div>
          </div>

          {/* Power BI Section */}
          {showPowerBI && (
            <Card className="fin-card p-4 mb-8 min-h-[650px]">
              <PowerBIEmbedComponent 
                reportId="YOUR_REPORT_ID_HERE"
                embedUrl="https://app.powerbi.com/reportEmbed?reportId=YOUR_REPORT_ID"
                accessToken="YOUR_EMBED_TOKEN_HERE"
              />
            </Card>
          )}

          {/* Filters */}
          <Card className="fin-card p-5 mb-8">
            <div className="flex flex-wrap gap-4">
              <Input 
                placeholder="Search reports..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  <SelectItem value="Regulatory">Regulatory</SelectItem>
                  <SelectItem value="Settlement">Settlement</SelectItem>
                  <SelectItem value="Internal">Internal</SelectItem>
                  <SelectItem value="Compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Ready">Ready</SelectItem>
                  <SelectItem value="Generated">Generated</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Reports List */}
          <Card className="fin-card overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Available Reports ({filteredReports.length})</h2>
            </div>

            <div className="divide-y">
              {filteredReports.map((report) => (
                <div key={report.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className="flex items-center gap-5">
                    <FileText className="w-10 h-10 text-slate-400" />
                    <div>
                      <p className="font-medium text-lg">{report.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {report.type} • {report.date} • {report.size}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge>{report.status}</Badge>

                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={exportingId === report.id}
                      onClick={() => exportToPDF(report)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </Button>

                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}