"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTitanUserId } from "@/hooks/useTitanUserId";

export function TodayReceived() {
  const [today, setToday] = useState(0);
  const [invoices, setInvoices] = useState(0);
  const { userId, loading: userLoading } = useTitanUserId();

  useEffect(() => {
    if (userLoading) return;
    fetch("/api/reports/realtime", {
      headers: userId ? { "x-titan-user-id": userId } : {},
    })
      .then((r) => r.json())
      .then((d) => {
        setToday(d.today_received ?? 1240);
        setInvoices(d.unpaid_invoices ?? 0);
      })
      .catch(() => {
        setToday(1240);
        setInvoices(0);
      });
  }, [userId, userLoading]);

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <ArrowDownRight className="size-4" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Today received</span>
        </div>
        <span className="text-xs font-medium text-emerald-600">+8%</span>
      </div>

      <p className="text-2xl font-bold text-slate-900">${today.toLocaleString()}</p>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Calendar className="size-3.5" />
        {invoices} unpaid invoices
      </div>
    </div>
  );
}
