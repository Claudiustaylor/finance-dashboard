"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Plus,
  SendHorizontal,
  HandCoins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
  balance?: number;
  changePercent?: number;
  currency?: string;
}

const MINI_BARS = [18, 28, 14, 36, 22, 40, 26, 44, 34, 52, 30, 48];

export function BalanceCard({
  balance = 0,
  changePercent = 0,
  currency = "USD",
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
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">My balance</p>
          <div className="flex items-center gap-2">
            <Select defaultValue={currency}>
              <SelectTrigger className="h-6 gap-1 rounded-full border-slate-200 bg-slate-50 px-2 py-0 text-xs font-medium text-slate-700 hover:bg-slate-100 [&_svg]:size-3">
                <SelectValue placeholder="USD" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              All time
            </span>
          </div>
        </div>
        <button className="text-slate-400 transition hover:text-slate-600">
          <span className="sr-only">Menu</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {formatted}
        </h2>
        <button
          onClick={() => setHidden((v) => !v)}
          className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label={hidden ? "Show balance" : "Hide balance"}
        >
          {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
        <span className="rounded-full bg-emerald-500 p-0.5">
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
        +{changePercent}% Balance increase, Good progress.
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
