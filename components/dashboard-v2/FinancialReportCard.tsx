"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Printer, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";

interface Report {
  total_balance?: number;
  income_90d?: number;
  expense_90d?: number;
  monthly_burn?: number;
  runway_months?: number | null;
  cash_flow?: { name: string; income: number; expense: number }[];
  income_change?: number;
  income_change_percent?: number;
  expense_change?: number;
  expense_change_percent?: number;
  balance_change_percent?: number;
}

interface FinancialReportCardProps {
  report?: Report | null;
}

function currency(n?: number) {
  if (n == null) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function FinancialReportCard({ report }: FinancialReportCardProps) {
  const [trackOpen, setTrackOpen] = useState(false);
  const trend = report?.cash_flow || [];

  return (
    <>
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-[0_2px_24px_-6px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-white/10">
              <FileText className="size-5 text-[#00aeef]" />
            </div>
            <p className="text-base font-semibold">Financial Report</p>
            <p className="mt-1 text-sm text-white/60">Track & print your monthly report.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setTrackOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
              size="sm"
            >
              <TrendingUp className="size-3.5" />
              Track
            </Button>
            <Button
              onClick={() => typeof window !== "undefined" && window.print()}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0071c5] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#005fa6]"
              size="sm"
            >
              <Printer className="size-3.5" />
              Print Report
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={trackOpen} onOpenChange={setTrackOpen}>
        <SheetContent side="bottom" className="bg-slate-900 text-white">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="size-4 text-[#00aeef]" />
              6-Month Trend
            </SheetTitle>
            <SheetDescription className="text-white/60">
              Income vs. expenses over the last six months.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 px-4 py-2">
            {trend.length === 0 ? (
              <p className="text-sm text-white/60">No trend data available.</p>
            ) : (
              trend.map((m) => (
                <div
                  key={m.name}
                  className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5"
                >
                  <span className="text-sm font-medium text-white">{m.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                      <ArrowUpRight className="size-3" />
                      {currency(m.income)}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-rose-400">
                      <ArrowDownRight className="size-3" />
                      {currency(m.expense)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 px-4 py-2">
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-white/60">Income change</p>
              <p className={cn("text-sm font-semibold", (report?.income_change ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {(report?.income_change ?? 0) >= 0 ? "+" : ""}
                {currency(report?.income_change)} ({(report?.income_change_percent ?? 0).toFixed(1)}%)
              </p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-white/60">Expense change</p>
              <p className={cn("text-sm font-semibold", (report?.expense_change ?? 0) <= 0 ? "text-emerald-400" : "text-rose-400")}>
                {(report?.expense_change ?? 0) >= 0 ? "+" : ""}
                {currency(report?.expense_change)} ({(report?.expense_change_percent ?? 0).toFixed(1)}%)
              </p>
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10" onClick={() => setTrackOpen(false)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
