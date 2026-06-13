"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Repeat, TrendingUp, AlertCircle, Calendar } from "lucide-react";

interface Transaction {
  id: string;
  name: string;
  merchant_name?: string | null;
  amount: number;
  date: string;
  plaid_category?: string[] | null;
}

interface Props {
  transactions: Transaction[];
}

interface RecurringGroup {
  normalizedName: string;
  count: number;
  avgAmount: number;
  cadence: "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly" | "irregular";
  confidence: "high" | "medium" | "low";
  dates: string[];
  totalSpent: number;
  totalReceived: number;
}

function normalizeName(name: string): string {
  return (name || "").toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+llc|\s+inc|\s+corp/g, "")
    .replace(/\bpayment\b|\bpymt\b|\bautopay\b/g, "")
    .trim()
    .substring(0, 30);
}

function detectCadence(dates: string[]): RecurringGroup["cadence"] {
  if (dates.length < 2) return "irregular";
  const d = dates.map((s) => new Date(s).getTime()).sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < d.length; i++) gaps.push((d[i] - d[i - 1]) / (1000 * 60 * 60 * 24));
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance = gaps.reduce((s, g) => s + Math.pow(g - avgGap, 2), 0) / gaps.length;
  const std = Math.sqrt(variance);

  if (avgGap >= 350 && avgGap <= 380 && std < 10) return "yearly";
  if (avgGap >= 88 && avgGap <= 95 && std < 7) return "quarterly";
  if (avgGap >= 28 && avgGap <= 32 && std < 5) return "monthly";
  if (avgGap >= 13 && avgGap <= 15 && std < 3) return "biweekly";
  if (avgGap >= 6 && avgGap <= 8 && std < 2) return "weekly";
  if (avgGap >= 28 && avgGap <= 35 && std < 10) return "monthly";
  return "irregular";
}

function cadenceLabel(c: RecurringGroup["cadence"]): string {
  return { weekly: "Weekly", biweekly: "Bi-weekly", monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly", irregular: "Irregular" }[c];
}

export function RecurringDetector({ transactions }: Props) {
  const [showAll, setShowAll] = useState(false);

  const groups = useMemo(() => {
    const byName = new Map<string, Transaction[]>();
    for (const t of transactions) {
      const norm = normalizeName(t.merchant_name || t.name || "");
      if (!norm || norm.length < 3) continue;
      const arr = byName.get(norm) || [];
      arr.push(t);
      byName.set(norm, arr);
    }

    const out: RecurringGroup[] = [];
    for (const [norm, txs] of byName.entries()) {
      if (txs.length < 2) continue;
      const dates = txs.map((t) => t.date).sort();
      const cadence = detectCadence(dates);
      const avgAmount = txs.reduce((s, t) => s + t.amount, 0) / txs.length;
      const variance = txs.reduce((s, t) => s + Math.pow(t.amount - avgAmount, 2), 0) / txs.length;
      const std = Math.sqrt(variance);
      const cv = avgAmount !== 0 ? std / Math.abs(avgAmount) : 1;

      let confidence: RecurringGroup["confidence"] = "low";
      if (txs.length >= 3 && cadence !== "irregular" && cv < 0.15) confidence = "high";
      else if (txs.length >= 2 && cadence !== "irregular" && cv < 0.35) confidence = "medium";

      if (confidence === "low") continue;

      out.push({
        normalizedName: norm,
        count: txs.length,
        avgAmount: avgAmount,
        cadence,
        confidence,
        dates,
        totalSpent: avgAmount > 0 ? txs.reduce((s, t) => s + t.amount, 0) : 0,
        totalReceived: avgAmount < 0 ? txs.reduce((s, t) => s + Math.abs(t.amount), 0) : 0,
      });
    }
    return out.sort((a, b) => b.count - a.count);
  }, [transactions]);

  if (!groups.length) return null;

  const incomeRecurring = groups.filter((g) => g.totalReceived > 0).reduce((s, g) => s + g.totalReceived, 0);
  const spendRecurring = groups.filter((g) => g.totalSpent > 0).reduce((s, g) => s + g.totalSpent, 0);

  const shown = showAll ? groups : groups.slice(0, 4);

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-[#0071c5]" />
          <h3 className="text-sm font-semibold text-white">Recurring Transactions</h3>
        </div>
        <span className="text-xs text-white/30">{groups.length} detected</span>
      </div>

      {/* Income vs Expense summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Recurring Income</span>
          </div>
          <p className="text-lg font-bold text-white tabular-nums">+${incomeRecurring.toFixed(2)}</p>
          <p className="text-xs text-white/40">{groups.filter((g) => g.totalReceived > 0).length} sources</p>
        </div>
        <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs text-red-400 font-medium">Recurring Spending</span>
          </div>
          <p className="text-lg font-bold text-white tabular-nums">-${spendRecurring.toFixed(2)}</p>
          <p className="text-xs text-white/40">{groups.filter((g) => g.totalSpent > 0).length} subscriptions</p>
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-2">
        {shown.map((g) => (
          <div key={g.normalizedName} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0071c5]/10 flex items-center justify-center">
                {g.totalReceived > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Repeat className="w-4 h-4 text-[#0071c5]" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white capitalize">{g.normalizedName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-white/40">
                    <Calendar className="w-3 h-3" />
                    {cadenceLabel(g.cadence)}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${g.confidence === "high" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {g.confidence === "high" ? "High confidence" : "Medium confidence"}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white tabular-nums">
                {g.avgAmount < 0 ? "+" : "-"}${Math.abs(g.avgAmount).toFixed(2)}
              </p>
              <p className="text-xs text-white/40">per cycle · {g.count}×</p>
            </div>
          </div>
        ))}
      </div>

      {groups.length > 4 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="w-full py-2 text-xs text-white/40 hover:text-white border border-white/[0.06] rounded-lg hover:bg-white/[0.02] transition-colors"
        >
          {showAll ? "Show less" : `Show all ${groups.length} recurring patterns`}
        </button>
      )}

      <p className="text-xs text-white/25">
        Detected using merchant name normalization, amount variance analysis, and date interval pattern matching.
        High confidence requires at least 3 transactions with low coefficient of variation.
      </p>
    </div>
  );
}
