// src/app/transactions/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useUIStore } from "@/store/uiStore";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";

type Transaction = {
  id: string;
  date: string;
  amount: number;
  source: string;
  destination: string;
  status: string;
  reference: string;
  type: string;
  currency: string;
};

const allTransactions: Transaction[] = [
  { id: "TXN-7849201", date: "2026-05-15 09:12", amount: 1250000, source: "NIBSS", destination: "Wallet", status: "Success", reference: "NIP-987654", type: "Transfer", currency: "NGN" },
  { id: "TXN-7849200", date: "2026-05-15 08:45", amount: 450000, source: "Paystack", destination: "Core Banking", status: "Success", reference: "PS-456789", type: "Payment", currency: "NGN" },
  { id: "TXN-7849199", date: "2026-05-15 08:30", amount: 2800000, source: "Flutterwave", destination: "Wallet", status: "Failed", reference: "FLW-321654", type: "Transfer", currency: "NGN" },
  { id: "TXN-7849198", date: "2026-05-15 07:55", amount: 920000, source: "Interswitch", destination: "Settlement", status: "Success", reference: "IS-112233", type: "Settlement", currency: "NGN" },
];

export default function TransactionsPage() {
  const { sidebarCollapsed } = useUIStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const itemsPerPage = 10;

  const processedTransactions = useMemo(() => {
    let result = [...allTransactions];

    result = result.filter(t => {
      const matchesSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.reference.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || t.status === statusFilter;
      const matchesSource = sourceFilter === "All" || t.source === sourceFilter;

      let matchesDate = true;
      if (dateFrom || dateTo) {
        const txDate = new Date(t.date.split(" ")[0]);
        if (dateFrom) matchesDate = matchesDate && txDate >= new Date(dateFrom);
        if (dateTo) matchesDate = matchesDate && txDate <= new Date(dateTo);
      }
      return matchesSearch && matchesStatus && matchesSource && matchesDate;
    });

    return result;
  }, [searchTerm, statusFilter, sourceFilter, dateFrom, dateTo]);

  const paginatedTransactions = processedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedTransactions.map(t => t.id)));
    }
  };

  const exportSelected = (format: 'excel' | 'csv') => {
    const dataToExport = selectedIds.size > 0 
      ? processedTransactions.filter(t => selectedIds.has(t.id)) 
      : processedTransactions;

    if (dataToExport.length === 0) return;

    const exportData = dataToExport.map(t => ({
      "TXN ID": t.id,
      "Date": t.date,
      "Amount": t.amount,
      "Source": t.source,
      "Destination": t.destination,
      "Reference": t.reference,
      "Type": t.type,
      "Status": t.status,
    }));

    if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");
      XLSX.writeFile(wb, `ReconFlow_Transactions_${new Date().toISOString().slice(0,10)}.xlsx`);
    } else {
      const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(exportData));
      const blob = new Blob([csv], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `ReconFlow_Transactions_${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />

      <main className={`flex-1 transition-all duration-300 p-8 ${sidebarCollapsed ? "ml-28" : "ml-72"}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">All Transactions</h1>
              <p className="text-slate-600 dark:text-slate-400">Bulk Actions • Multi Export</p>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <Button onClick={() => exportSelected('excel')} className="flex-1 sm:flex-none">
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button onClick={() => exportSelected('csv')} variant="outline" className="flex-1 sm:flex-none">
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="fin-card p-5 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Input 
                placeholder="Search TXN ID or Reference" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Success">Success</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Sources</SelectItem>
                  <SelectItem value="NIBSS">NIBSS</SelectItem>
                  <SelectItem value="Paystack">Paystack</SelectItem>
                  <SelectItem value="Flutterwave">Flutterwave</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card className="fin-card overflow-hidden">
            <div className="p-6 border-b flex justify-between">
              <h2 className="text-xl font-semibold">Transaction History ({processedTransactions.length})</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b">
                    <th className="px-4 py-5 w-12">
                      <Checkbox 
                        checked={selectedIds.size === paginatedTransactions.length && paginatedTransactions.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-5 text-left">TXN ID</th>
                    <th className="px-4 py-5 text-left">Date</th>
                    <th className="px-4 py-5 text-left">Amount</th>
                    <th className="px-4 py-5 text-left">Source → Destination</th>
                    <th className="px-4 py-5 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-5">
                        <Checkbox 
                          checked={selectedIds.has(tx.id)} 
                          onCheckedChange={() => toggleSelect(tx.id)} 
                        />
                      </td>
                      <td className="px-4 py-5 font-mono">{tx.id}</td>
                      <td className="px-4 py-5 text-sm">{tx.date}</td>
                      <td className="px-4 py-5 font-medium">₦{tx.amount.toLocaleString()}</td>
                      <td className="px-4 py-5">{tx.source} → {tx.destination}</td>
                      <td className="px-4 py-5">
                        <Badge variant={tx.status === "Success" ? "default" : "destructive"}>{tx.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-6 border-t flex items-center justify-between">
              <Button 
                variant="outline" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <span>Page {currentPage} of {Math.ceil(processedTransactions.length / itemsPerPage) || 1}</span>
              <Button 
                variant="outline" 
                disabled={currentPage * itemsPerPage >= processedTransactions.length} 
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}