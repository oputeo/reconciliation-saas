// src/app/reconciliation/page.tsx
"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useUIStore } from "@/store/uiStore";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, RefreshCw, AlertCircle, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

type Break = {
  id: string;
  source: string;
  dest: string;
  amount: number;
  date: string;
  reason: string;
  status: "Unreconciled" | "Pending" | "Resolved";
};

const initialBreaks: Break[] = [
  { id: "BRK-8921", source: "NIBSS", dest: "Wallet", amount: 2450000, date: "2026-05-17", reason: "Timing Difference", status: "Unreconciled" },
  { id: "BRK-8920", source: "Paystack", dest: "Core Banking", amount: 875500, date: "2026-05-17", reason: "Partial Match", status: "Pending" },
  { id: "BRK-8919", source: "Flutterwave", dest: "Wallet", amount: 1250000, date: "2026-05-16", reason: "Missing Transaction", status: "Unreconciled" },
  { id: "BRK-8918", source: "Interswitch", dest: "Settlement", amount: 3200000, date: "2026-05-16", reason: "Duplicate", status: "Resolved" },
];

export default function ReconciliationPage() {
  const { sidebarCollapsed } = useUIStore();
  const [breaks] = useState<Break[]>(initialBreaks);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState({});
  const [expandedBreak, setExpandedBreak] = useState<string | null>(null);

  const columns: ColumnDef<Break>[] = [
    {
      id: "select",
      header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} />,
      cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} />,
    },
    { accessorKey: "id", header: "Break ID" },
    { accessorKey: "source", header: "Source" },
    { accessorKey: "dest", header: "Destination" },
    { accessorKey: "amount", header: "Amount", cell: ({ row }) => `₦${row.original.amount.toLocaleString()}` },
    { accessorKey: "date", header: "Date" },
    { accessorKey: "reason", header: "Reason" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant={row.original.status === "Resolved" ? "default" : row.original.status === "Pending" ? "secondary" : "destructive"}>{row.original.status}</Badge>,
    },
    {
      id: "ai",
      header: "AI Analysis",
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => setExpandedBreak(expandedBreak === row.original.id ? null : row.original.id)}>
          <AlertCircle className="mr-2 h-4 w-4" />
          {expandedBreak === row.original.id ? "Hide" : "AI Root Cause"}
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: breaks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    state: { globalFilter, rowSelection },
  });

  const selectedCount = Object.keys(rowSelection).length;

  const exportSelectedExcel = () => {
    const selectedData = table.getSelectedRowModel().rows.map(row => row.original);
    if (selectedData.length === 0) return;

    const exportData = selectedData.map(item => ({
      "Break ID": item.id,
      "Source": item.source,
      "Destination": item.dest,
      "Amount (₦)": item.amount,
      "Date": item.date,
      "Reason": item.reason,
      "Status": item.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Selected_Breaks");
    XLSX.writeFile(wb, `ReconFlow_Selected_Breaks_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const exportCBNReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("CBN Daily Reconciliation Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);

    let y = 50;
    breaks.forEach((item, i) => {
      doc.text(`${item.id} | ${item.source} → ${item.dest} | ₦${item.amount.toLocaleString()} | ${item.status}`, 20, y);
      y += 10;
    });

    doc.save(`CBN_Reconciliation_Report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className={`flex-1 transition-all duration-300 p-8 ${sidebarCollapsed ? "ml-0" : "ml-72"}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Reconciliation Engine</h1>
              <p className="text-slate-600">Automated Matching • AI Root Cause • CBN Ready</p>
            </div>
            <Button onClick={exportCBNReport}>
              <FileText className="mr-2 h-4 w-4" />
              Generate CBN Report (PDF)
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="fin-card p-6"><p className="text-sm text-slate-600">Total Breaks</p><p className="text-4xl font-bold text-orange-600 mt-3">248</p></Card>
            <Card className="fin-card p-6"><p className="text-sm text-slate-600">Match Rate</p><p className="text-4xl font-bold text-emerald-600 mt-3">98.7%</p></Card>
            <Card className="fin-card p-6"><p className="text-sm text-slate-600">Today's Volume</p><p className="text-4xl font-bold mt-3">2.84M</p></Card>
            <Card className="fin-card p-6"><p className="text-sm text-slate-600">Risk Exposure</p><p className="text-4xl font-bold text-red-600 mt-3">₦18.4M</p></Card>
          </div>

          <Input
            placeholder="Natural language query → Show all unreconciled NIBSS transactions above ₦1M this week"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="mb-6"
          />

          {/* Bulk Actions */}
          {selectedCount > 0 && (
            <div className="mb-6 bg-white border rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <span className="font-medium">{selectedCount} row(s) selected</span>
              <Button>Resolve Selected</Button>
              <Button variant="outline" onClick={exportSelectedExcel}>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
            </div>
          )}

          {/* Table */}
          <Card className="fin-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id} className="bg-slate-50 border-b">
                      {headerGroup.headers.map(header => (
                        <th 
                          key={header.id} 
                          className="px-6 py-4 text-left font-medium cursor-pointer hover:bg-slate-100"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() ? (header.column.getIsSorted() === 'desc' ? ' ↓' : ' ↑') : ''}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => {
                    const brk = row.original;
                    const isExpanded = expandedBreak === brk.id;

                    return (
                      <React.Fragment key={row.id}>
                        <tr className="border-b hover:bg-slate-50">
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id} className="px-6 py-5">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                        {isExpanded && (
                          <tr className="bg-emerald-50">
                            <td colSpan={8} className="p-8">
                              <div className="max-w-3xl mx-auto bg-white rounded-3xl p-8 shadow">
                                <h4 className="font-semibold text-emerald-700 mb-4">🤖 AI Root Cause Analysis</h4>
                                <p><strong>Primary Cause:</strong> Cut-off timing mismatch</p>
                                <p className="text-emerald-600">Confidence: 94%</p>
                                <Button className="mt-6" onClick={() => setExpandedBreak(null)}>
                                  Close Analysis
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t flex items-center justify-between">
              <Button variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
              <span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
              <Button variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}