"use client";

import { useState } from "react";
import { Eye, EyeOff, Plus, SendHorizontal, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
  balance?: number;
  changePercent?: number;
  currency?: string;
  loading?: boolean;
}

const MINI_BARS = [18, 28, 14, 36, 22, 40, 26, 44, 34, 52, 30, 48];

export function BalanceCard({
  balance = 0,
  changePercent = 0,
  currency = "USD",
  loading = false,
}: BalanceCardProps) {
  const [hidden, setHidden] = useState(false);

  const formatted = hidden
    ? "••••••••"
    : balance.toLocaleString("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      });

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white p-5 sm:p-6 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
      {/* Mini decorative bar chart */}
      <div className="pointer-events-none absolute right-3 top-10 flex items-end gap-[3px] opacity-80">
        {MINI_BARS.map((h, i) => (
          <div
            key={i}
            className={cn(
              "w-[5px] rounded-t-sm",
              i % 3 === 0 ? "bg-[#00aeef]" : "bg-[#0071c5]",
              i % 5 === 0 && "bg-emerald-400"
            )}
            style={{ height: `${h * 0.9}px` }}
          />
        ))}
      </div>

      <div className="flex items-start justify-between pr-2">
        <div>
          <p className="text-sm font-medium text-slate-500">Total balance</p>
          {loading ? (
            <div className="mt-2 h-9 w-40 animate-pulse rounded-lg bg-slate-100" />
          ) : (
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {formatted}
            </p>
          )}
        </div>
        <button
          onClick={() => setHidden((v) => !v)}
          className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
        <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white">
          <svg
            className="size-2.5 text-white"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 2v8M2 6l4-4 4 4" />
          </svg>
        </span>
        {changePercent >= 0 ? "+" : ""}
        {changePercent}% Balance increase, Good progress.
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
        <Button
          size="sm"
          className="rounded-full bg-[#0071c5] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#005fa6]"
        >
          <Plus className="size-3.5" />
          Add Money
        </Button>
        <Button
          size="sm"
          className="rounded-full bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <SendHorizontal className="size-3.5" />
          Send Money
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <HandCoins className="size-3.5" />
          Request Money
        </Button>
      </div>
    </div>
  );
}
