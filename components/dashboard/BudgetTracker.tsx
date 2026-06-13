"use client";

import { useState } from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";

interface BudgetItem {
  id: string;
  category: string;
  limit: number;
  spent: number;
}

interface Props {
  transactions: Array<{
    amount: number;
    plaid_category?: string[] | null;
    date: string;
  }>;
}

const PRESET_CATEGORIES = [
  "Dining",
  "Groceries",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills",
  "Travel",
  "Health",
  "Uncategorized",
];

export function BudgetTracker({ transactions }: Props) {
  const [budgets, setBudgets] = useState<BudgetItem[]>([
    { id: "1", category: "Dining", limit: 500, spent: 0 },
    { id: "2", category: "Groceries", limit: 800, spent: 0 },
    { id: "3", category: "Transportation", limit: 300, spent: 0 },
    { id: "4", category: "Entertainment", limit: 200, spent: 0 },
  ]);

  // Calculate spending per category from real transactions
  const spendingMap = new Map<string, number>();
  (transactions || []).forEach((t) => {
    if (t.amount > 0) {
      const cat = (t.plaid_category?.[0] || "Uncategorized").replace(/_/g, " ");
      spendingMap.set(cat, (spendingMap.get(cat) || 0) + Number(t.amount));
    }
  });

  const budgetsWithSpending = budgets.map((b) => ({
    ...b,
    spent: spendingMap.get(b.category) || 0,
    pct: Math.min(((spendingMap.get(b.category) || 0) / b.limit) * 100, 100),
  }));

  const [newCategory, setNewCategory] = useState("");
  const [newLimit, setNewLimit] = useState("");

  const addBudget = () => {
    if (!newCategory || !newLimit) return;
    setBudgets((prev) => [
      ...prev,
      { id: crypto.randomUUID(), category: newCategory, limit: Number(newLimit), spent: 0 },
    ]);
    setNewCategory("");
    setNewLimit("");
  };

  const removeBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white">Budgets</h3>
        <span className="text-xs text-white/30">This month</span>
      </div>

      <div className="space-y-4">
        {budgetsWithSpending.map((b) => {
          const isOver = b.pct >= 100;
          const isWarning = b.pct >= 80 && !isOver;
          return (
            <div key={b.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{b.category}</span>
                  {isOver && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                  {isWarning && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">
                    ${b.spent.toFixed(2)} / ${b.limit.toFixed(0)}
                  </span>
                  <button
                    onClick={() => removeBudget(b.id)}
                    className="text-white/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOver
                      ? "bg-red-500"
                      : isWarning
                      ? "bg-amber-400"
                      : "bg-gradient-to-r from-[#0071c5] to-[#00aeef]"
                  }`}
                  style={{ width: `${Math.min(b.pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add budget */}
      <div className="mt-5 pt-4 border-t border-white/[0.06]">
        <div className="flex items-end gap-2">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-[#0071c5]"
          >
            <option value="" className="bg-[#0f1115]">Select category</option>
            {PRESET_CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[#0f1115]">{c}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Limit $"
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
            className="w-24 px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:border-[#0071c5]"
          />
          <button
            onClick={addBudget}
            className="px-3 py-2 bg-[#0071c5] text-white text-sm rounded-lg hover:bg-[#0071c5]/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
