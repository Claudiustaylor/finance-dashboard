"use client";

import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";

interface Transaction {
  id: string;
  name: string;
  merchant_name?: string | null;
  amount: number;
  date: string;
  plaid_category?: string[] | null;
}

interface Props {
  transactions: Transaction[];
}

function escapeCSV(val: string): string {
  const s = String(val ?? "").replace(/"/g, '""');
  if (s.includes(",") || s.includes("\n") || s.includes('"')) return `"${s}"`;
  return s;
}

function buildCSV(transactions: Transaction[]): string {
  const headers = ["Date", "Merchant", "Category", "Amount", "Type"];
  const rows = transactions.map((t) => {
    const cat = (t.plaid_category?.[0] || "Uncategorized").replace(/_/g, " ");
    const isIncome = t.amount < 0;
    return [
      t.date,
      t.merchant_name || t.name,
      cat,
      Math.abs(t.amount).toFixed(2),
      isIncome ? "Income" : "Expense",
    ];
  });
  return [headers.join(","), ...rows.map((r) => r.map(escapeCSV).join(","))].join("\n");
}

export function TransactionCSVExport({ transactions }: Props) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    if (!transactions.length) return;
    setDownloading(true);
    const csv = buildCSV(transactions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `titan_transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloading(false), 500);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={!transactions.length || downloading}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0071c5] hover:text-[#00aeef] border border-[#0071c5]/20 rounded-lg hover:bg-[#0071c5]/5 transition-all disabled:opacity-40"
    >
      <FileSpreadsheet className="w-4 h-4" />
      {downloading ? "Generating..." : "Export CSV"}
    </button>
  );
}
