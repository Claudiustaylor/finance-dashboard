"use client";

import { useState } from "react";
import { ArrowDownRight, Calendar } from "lucide-react";

interface TodayReceivedProps {
  todayReceived?: number;
  unpaidInvoices?: number;
  loading?: boolean;
}

export function TodayReceived({ todayReceived = 0, unpaidInvoices = 0, loading = false }: TodayReceivedProps) {
  const [today] = useState(todayReceived);
  const [invoices] = useState(unpaidInvoices);

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <ArrowDownRight className="size-4" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Today received</span>
        </div>
        {!loading && (
          <span className="text-xs font-medium text-emerald-600">+{today.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
        )}
      </div>

      {loading ? (
        <div className="mt-2 h-8 w-28 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className="text-2xl font-bold text-slate-900">${today.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
      )}

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Calendar className="size-3.5" />
        {invoices} unpaid invoices
      </div>
    </div>
  );
}
