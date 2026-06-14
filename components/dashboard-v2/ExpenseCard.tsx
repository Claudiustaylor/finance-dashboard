"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTitanUserId } from "@/hooks/useTitanUserId";

interface ExpenseCardProps {
  expense?: number;
  change?: number;
}

export function ExpenseCard({ expense: expenseProp, change: changeProp }: ExpenseCardProps) {
  const [expense, setExpense] = useState(0);
  const [change, setChange] = useState(0);
  const { userId, loading: userLoading } = useTitanUserId();

  useEffect(() => {
    if (userLoading) return;
    fetch("/api/reports/realtime", {
      headers: userId ? { "x-titan-user-id": userId } : {},
    })
      .then((r) => r.json())
      .then((d) => {
        setExpense(expenseProp ?? d.expense_90d ?? 0);
        setChange(changeProp ?? d.expense_change ?? 0);
      })
      .catch(() => {
        setExpense(expenseProp ?? 0);
        setChange(changeProp ?? 0);
      });
  }, [userId, userLoading, expenseProp, changeProp]);

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <TrendingDown className="size-4" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Total expense</span>
        </div>
        <span className="text-xs font-medium text-rose-600">+{change}%</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">${expense.toLocaleString()}</p>
      <div className="mt-4 flex items-center gap-1 text-xs text-slate-500">
        <ArrowUpRight className="size-3.5" />
        vs last month
      </div>
    </div>
  );
}
