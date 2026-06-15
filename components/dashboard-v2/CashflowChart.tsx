"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthData {
  name: string;
  income: number;
  expense: number;
}

interface CashflowChartProps {
  data?: MonthData[];
}

const DEFAULT_DATA: MonthData[] = [
  { name: "Jan", income: 2400, expense: 1200 },
  { name: "Feb", income: 3200, expense: 1800 },
  { name: "Mar", income: 3000, expense: 1000 },
  { name: "Apr", income: 2800, expense: 1600 },
  { name: "May", income: 3600, expense: 1400 },
  { name: "Jun", income: 4000, expense: 2000 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg">
        <p className="text-xs font-semibold text-slate-500">{label} 2025</p>
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0071c5]" />
            <span className="text-xs text-slate-500">Income</span>
            <span className="ml-auto text-xs font-bold text-slate-900">
              ${payload[0].value.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#00aeef]" />
            <span className="text-xs text-slate-500">Expense</span>
            <span className="ml-auto text-xs font-bold text-slate-900">
              ${payload[1].value.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function CashflowChart({ data = DEFAULT_DATA }: CashflowChartProps) {
  const [period, setPeriod] = useState<"month" | "year">("month");

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-base font-semibold text-slate-900">Cashflow chart</p>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full bg-slate-100 p-0.5">
            {(["year", "month"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full transition",
                  period === p
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </div>

      <div className="h-[220px] w-full sm:h-[240px] flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid
              vertical={false}
              stroke="#f1f5f9"
              strokeDasharray="0"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(v) => `$${v / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
            <Bar
              dataKey="income"
              fill="#0071c5"
              radius={[6, 6, 6, 6]}
              barSize={18}
            />
            <Bar
              dataKey="expense"
              fill="#00aeef"
              radius={[6, 6, 6, 6]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
