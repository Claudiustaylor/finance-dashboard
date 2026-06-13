"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = ["#0071c5", "#00aeef", "#1a8cff", "#4da6ff", "#80bfff", "#b3d9ff", "#e6f2ff"];

interface Transaction {
  amount: number;
  plaid_category?: string[] | null;
  date: string;
}

interface Props {
  transactions: Transaction[];
}

export function SpendingCharts({ transactions }: Props) {
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    (transactions || []).forEach((t) => {
      const cat = (t.plaid_category?.[0] || "Uncategorized").replace(/_/g, " ");
      if (t.amount > 0) {
        map.set(cat, (map.get(cat) || 0) + Number(t.amount));
      }
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; income: number; spending: number }>();
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    (transactions || []).forEach((t) => {
      const d = new Date(t.date);
      const key = months[d.getMonth()];
      const existing = map.get(key) || { month: key, income: 0, spending: 0 };
      if (t.amount < 0) existing.income += Math.abs(Number(t.amount));
      else existing.spending += Number(t.amount);
      map.set(key, existing);
    });
    return months.map((m) => map.get(m) || { month: m, income: 0, spending: 0 });
  }, [transactions]);

  if (!transactions?.length) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center flex flex-col justify-center">
          <p className="text-white/40">No spending data yet. Sync your account to see charts.</p>
        </div>
        <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center flex flex-col justify-center">
          <p className="text-white/40">No spending data yet. Sync your account to see charts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white mb-4">Spending by Category</h3>
        <div className="h-48 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {categoryData.map((_c: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f1115",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(v: any) => [`$${Number(v || 0).toFixed(2)}`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {categoryData.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-white/60">{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white mb-4">Monthly Cash Flow</h3>
        <div className="h-48 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f1115",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(v: any, name: any) => [`$${Number(v || 0).toFixed(2)}`, name]}
              />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spending" name="Spending" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
