"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Flame, Clock, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface Report {
  total_balance?: number;
  income_90d?: number;
  expense_90d?: number;
  monthly_burn?: number;
  runway_months?: number | null;
  cash_flow?: { name: string; income: number; expense: number }[];
}

interface RealtimeReportsProps {
  report?: Report | null;
  loading?: boolean;
}

export function RealtimeReports({ report, loading }: RealtimeReportsProps) {
  const cards = [
    {
      label: "Total Balance",
      value: report?.total_balance ?? 0,
      icon: DollarSign,
      color: "text-[#0071c5]",
      bg: "bg-[#0071c5]/10",
    },
    {
      label: "90-Day Income",
      value: report?.income_90d ?? 0,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-500/10",
    },
    {
      label: "90-Day Expense",
      value: report?.expense_90d ?? 0,
      icon: TrendingDown,
      color: "text-rose-600",
      bg: "bg-rose-500/10",
    },
    {
      label: "Monthly Burn",
      value: report?.monthly_burn ?? 0,
      icon: Flame,
      color: "text-amber-600",
      bg: "bg-amber-500/10",
    },
    {
      label: "Runway",
      value: report?.runway_months ?? null,
      suffix: report?.runway_months != null ? " months" : "",
      icon: Clock,
      color: "text-violet-600",
      bg: "bg-violet-500/10",
    },
  ];

  function fmt(v: number | null | undefined) {
    if (v == null) return "—";
    if (typeof v === "number" && v > 999) return v.toLocaleString("en-US", { maximumFractionDigits: 1 });
    if (typeof v === "number") return v.toFixed(1);
    return String(v);
  }

  if (loading) {
    return (
      <div className="grid animate-pulse grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl bg-white p-4 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]"
        >
          <div className="mb-2 flex items-center gap-2">
            <div className={cn("flex size-8 items-center justify-center rounded-xl", c.bg)}>
              <c.icon className={cn("size-4", c.color)} />
            </div>
            <span className="text-xs text-slate-500">{c.label}</span>
          </div>
          <p className="text-xl font-bold text-slate-900">
            {c.label.includes("Balance") || c.label.includes("Income") || c.label.includes("Expense") || c.label.includes("Burn")
              ? `$${fmt(c.value)}`
              : `${fmt(c.value)}${c.suffix || ""}`}
          </p>
        </div>
      ))}
    </div>
  );
}
