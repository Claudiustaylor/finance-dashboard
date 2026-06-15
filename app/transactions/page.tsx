"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Receipt, CircleDollarSign, ShoppingBag, Briefcase, Plane, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTitanUserId } from "@/hooks/useTitanUserId";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Software & SaaS": Briefcase,
  Entertainment: ShoppingBag,
  Revenue: ArrowLeft,
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

export default function TransactionsPage() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useTitanUserId();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await fetch("/api/transactions?limit=100", {
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
        setError("Could not load transactions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
            <ArrowLeft className="size-4" /> Back
          </Link>
          <h1 className="text-base font-semibold">Transactions</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-3 p-4 pb-24">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
            <Receipt className="mx-auto size-8 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">{error}</p>
          </div>
        ) : txns.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
            <Receipt className="mx-auto size-8 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No transactions found.</p>
          </div>
        ) : (
          txns.map((t) => {
            const positive = t.amount < 0;
            const Icon = ICONS[t.category] || ICONS.default;
            const accountLabel = [t.accountName, t.accountSubtype, t.accountType].filter(Boolean).join(" · ");
            return (
              <div
                key={t.id}
                className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full",
                      positive ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">
                      {t.category}
                      {t.date ? ` · ${t.date}` : ""}
                      {accountLabel ? ` · ${accountLabel}` : ""}
                    </p>
                  </div>
                </div>
                <span className={cn("shrink-0 text-sm font-semibold tabular-nums", positive ? "text-emerald-600" : "text-slate-900")}>
                  {positive ? "+" : ""}${Math.abs(t.amount).toFixed(2)}
                </span>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
