"use client";

import { ArrowUpRight, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpenseCardProps {
  expense?: number;
  change?: number;
  changePercent?: number;
  loading?: boolean;
}

export function ExpenseCard({ expense = 0, change = 0, changePercent = 0, loading = false }: ExpenseCardProps) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <TrendingDown className="size-4" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Total expense</span>
        </div>
        {!loading && (
          <span className={cn("text-xs font-medium", changePercent >= 0 ? "text-rose-600" : "text-emerald-600")}>
            {changePercent >= 0 ? "+" : ""}
            {changePercent}%
          </span>
        )}
      </div>
      {loading ? (
        <div className="mt-2 h-8 w-32 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className="text-2xl font-bold text-slate-900">${expense.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      )}
      <div className="mt-4 flex items-center gap-1 text-xs text-slate-500">
        <ArrowUpRight className="size-3.5" />
        {change >= 0 ? "+" : ""}${Math.abs(change).toLocaleString("en-US", { minimumFractionDigits: 2 })} vs last month
      </div>
    </div>
  );
}
