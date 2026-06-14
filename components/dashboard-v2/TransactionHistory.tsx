"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Image as ImageIcon, Music, ArrowUpRight, MoreHorizontal, FileText, Clapperboard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Software: ImageIcon,
  Entertainment: Music,
  Revenue: ArrowUpRight,
  Cloud: FileText,
  default: Clapperboard,
};

interface Transaction {
  id: string;
  name: string;
  merchant_name: string | null;
  category: string;
  amount: number;
  date: string;
}

interface TransactionHistoryProps {
  userId?: string | null;
}

export function TransactionHistory({ userId }: TransactionHistoryProps) {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/transactions?limit=10", {
          headers: { "x-titan-user-id": userId },
        });
        const data = await res.json();
        const rows: Transaction[] = (data.transactions || []).map((t: any) => ({
          id: t.id,
          name: t.name || t.merchant_name || "Transaction",
          merchant_name: t.merchant_name || null,
          category: t.ai_category || t.plaid_category || "Uncategorized",
          amount: Number(t.amount || 0),
          date: t.date,
        }));
        setTxns(rows);
      } catch (err) {
        console.error("Failed to load transactions", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-5 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] flex items-center justify-center h-48">
        <Loader2 className="size-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const display = txns.length ? txns : [
    { id: "1", name: "Figma subscription", category: "Software", amount: -45.0, date: "" },
    { id: "2", name: "Spotify", category: "Entertainment", amount: -9.99, date: "" },
    { id: "3", name: "Stripe payout", category: "Revenue", amount: 1240.0, date: "" },
    { id: "4", name: "AWS hosting", category: "Cloud", amount: -284.5, date: "" },
    { id: "5", name: "Client invoice", category: "Revenue", amount: 3500.0, date: "" },
  ];

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">Transactions</span>
        <button className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <MoreHorizontal className="size-4" />
        </button>
      </div>
      <div className="space-y-3">
        {display.slice(0, 5).map((t) => {
          const positive = t.amount < 0;
          const Icon = ICONS[t.category] || ICONS.default;
          return (
            <div key={t.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full",
                    positive ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600"
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.category}{t.date ? ` · ${t.date}` : ""}</p>
                </div>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold",
                  positive ? "text-emerald-600" : "text-slate-900"
                )}
              >
                {positive ? "+" : ""}${Math.abs(t.amount).toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
