"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { ArrowUpRight, MoreHorizontal, Loader2, Receipt, CircleDollarSign, ShoppingBag, Briefcase, Plane, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Software & SaaS": Briefcase,
  Entertainment: ShoppingBag,
  Revenue: ArrowUpRight,
  Cloud: Briefcase,
  Travel: Plane,
  Meals: Utensils,
  default: CircleDollarSign,
};

interface Transaction {
  id: string;
  name: string;
  merchant_name: string | null;
  category: string;
  amount: number;
  date: string;
  accountName: string | null;
  accountType: string | null;
  accountSubtype: string | null;
}

interface TransactionHistoryProps {
  userId?: string | null;
}

export function TransactionHistory({ userId }: TransactionHistoryProps) {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await fetch("/api/transactions?limit=5", {
          headers: { "x-titan-user-id": userId },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const rows: Transaction[] = (data.transactions || []).map((t: any) => ({
          id: t.id,
          name: t.name || t.merchant_name || "Transaction",
          merchant_name: t.merchant_name || null,
          category: t.ai_category || (Array.isArray(t.plaid_category) ? t.plaid_category[0] : t.plaid_category || "Uncategorized"),
          amount: Number(t.amount ?? 0),
          date: t.date,
          accountName: t.accounts?.name || t.accounts?.official_name || null,
          accountType: t.accounts?.type || null,
          accountSubtype: t.accounts?.subtype || null,
        }));
        setTxns(rows);
      } catch (err) {
        console.error("Failed to load transactions", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <div className="rounded-3xl bg-white p-5 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] flex items-center justify-center h-48">
        <Loader2 className="size-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">Transactions</span>
        <button className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      {txns.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <Receipt className="size-8 text-slate-300" />
          <p className="text-sm text-slate-500">No recent transactions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {txns.map((t) => {
            const positive = t.amount < 0;
            const Icon = ICONS[t.category] || ICONS.default;
            const accountLabel = [t.accountName, t.accountSubtype, t.accountType].filter(Boolean).join(" · ");
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
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.category}{t.date ? ` · ${t.date}` : ""}{accountLabel ? ` · ${accountLabel}` : ""}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold shrink-0",
                    positive ? "text-emerald-600" : "text-slate-900"
                  )}
                >
                  {positive ? "+" : ""}${Math.abs(t.amount).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
