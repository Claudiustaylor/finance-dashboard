"use client";

import { ArrowUpRight } from "lucide-react";

interface IncomeCardProps {
  total?: number;
  change?: number;
  changePercent?: number;
  loading?: boolean;
}

export function IncomeCard({
  total = 0,
  change = 0,
  changePercent = 0,
  loading = false,
}: IncomeCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white p-5 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
      <div className="absolute -right-5 -top-3 rotate-[-8deg] rounded-2xl bg-emerald-50 px-5 py-4 shadow-sm ring-1 ring-emerald-100">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500 text-white">
            <ArrowUpRight className="size-4" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Income</p>
            {loading ? (
              <div className="h-5 w-20 animate-pulse rounded bg-slate-200" />
            ) : (
              <p className="text-lg font-bold text-slate-900">
                ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="pt-14">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
          <ArrowUpRight className="size-3" />
          {change >= 0 ? "+" : ""}
          ${change.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Income {changePercent >= 0 ? "increased" : "decreased"} by {Math.abs(changePercent)}% from last month.
        </p>
      </div>
    </div>
  );
}
