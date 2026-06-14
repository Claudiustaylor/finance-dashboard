"use client";

import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface IncomeCardProps {
  total?: number;
  change?: number;
  changePercent?: number;
  salary?: number;
  freelance?: number;
}

export function IncomeCard({
  total = 0,
  change = 0,
  changePercent = 0,
  salary = 0,
  freelance = 0,
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
            <p className="text-lg font-bold text-slate-900">
              ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="pt-14">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
          <ArrowUpRight className="size-3" />
          +${change.toLocaleString()}
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Income increased by {changePercent}% from last month.
        </p>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#0071c5]" />
              <span className="text-sm text-slate-600">Salary</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">
              ${salary.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-[#00aeef]" />
              <span className="text-sm text-slate-600">Freelance</span>
            </div>
            <span className="text-sm font-semibold text-slate-900">
              ${freelance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
