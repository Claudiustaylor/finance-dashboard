"use client";

import { FileText, Printer, TrendingUp } from "lucide-react";

export function FinancialReportCard() {
  return (
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
          <button className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20">
            <TrendingUp className="size-3.5" />
            Track
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-full bg-[#0071c5] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#005fa6]">
            <Printer className="size-3.5" />
            Print Report
          </button>
        </div>
      </div>
    </div>
  );
}
