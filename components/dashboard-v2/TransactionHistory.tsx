"use client";

import * as React from "react";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowUpRight, MoreHorizontal, Loader2, Receipt, CircleDollarSign, ShoppingBag, Briefcase, Plane, Utensils, ChevronDown, ChevronUp } from "lucide-react";
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

const PAGE_SIZE = 5;

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function TransactionName({ name }: { name: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = name.length > 26;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (long) setExpanded((v) => !v);
      }}
      className={cn(
        "block text-left text-sm font-medium text-slate-900",
        !expanded && "truncate max-w-[160px] sm:max-w-[200px]"
      )}
      title={name}
    >
      {name}
      {long && (
        <span className="ml-1 inline-flex align-middle text-slate-400">
          {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </span>
      )}
    </button>
  );
}

export function TransactionHistory({ userId }: TransactionHistoryProps) {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async (currentOffset: number, append: boolean, all = false) => {
    if (!userId) return;
    if (currentOffset === 0) setLoading(true);
    else setLoadingMore(true);
    setError(null);
    try {
      const limit = all ? 500 : PAGE_SIZE;
      const res = await fetch(`/api/transactions?limit=${limit}&offset=${currentOffset}`, {
        headers: { "x-titan-user-id": userId },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
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
      setTxns((prev) => (append ? [...prev, ...rows] : rows));
      setHasMore(rows.length === limit);
    } catch (err) {
      console.error("Failed to load transactions", err);
      setError("Could not load transactions.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    setOffset(0);
    if (!cancelled) load(0, false);
    return () => { cancelled = true; };
  }, [userId, load]);

  const handleShowMore = () => {
    const nextOffset = offset + PAGE_SIZE;
    setOffset(nextOffset);
    load(nextOffset, true);
  };

  const handleShowAll = () => {
    setShowAll(true);
    load(0, false, true);
  };

  if (loading && txns.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-5 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] flex items-center justify-center h-48">
        <Loader2 className="size-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] flex flex-col max-h-[420px]">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">Transactions</span>
        <Link
          href="/transactions"
          className="text-xs font-medium text-[#0071c5] hover:text-[#00aeef]"
        >
          View all
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 -mr-1">
        {error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <Receipt className="size-8 text-slate-300" />
            <p className="text-sm text-slate-500">{error}</p>
          </div>
        ) : txns.length === 0 ? (
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
                <div key={t.id} className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        positive ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <TransactionName name={t.name} />
                      <p className="truncate text-xs text-slate-500">
                        {t.category}
                        {t.date ? ` · ${t.date}` : ""}
                        {accountLabel ? ` · ${accountLabel}` : ""}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-right text-sm font-semibold tabular-nums",
                      positive ? "text-emerald-600" : "text-slate-900"
                    )}
                    title={formatCurrency(positive ? -t.amount : t.amount)}
                  >
                    {positive ? "+" : ""}${Math.abs(t.amount).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {txns.length > 0 && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={handleShowMore}
              disabled={loadingMore || !hasMore}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0071c5] transition hover:text-[#00aeef] disabled:pointer-events-none disabled:text-slate-400"
            >
              {loadingMore && <Loader2 className="size-3 animate-spin" />}
              {loadingMore ? "Loading..." : hasMore ? "Show more" : "No more transactions"}
            </button>
            {!showAll && hasMore && (
              <button
                onClick={handleShowAll}
                disabled={loadingMore}
                className="text-xs font-medium text-slate-500 transition hover:text-slate-800 disabled:opacity-50"
              >
                Show all
              </button>
            )}
          </div>
          <span className="text-xs text-slate-400">
            Showing {txns.length}
          </span>
        </div>
      )}
    </div>
  );
}
