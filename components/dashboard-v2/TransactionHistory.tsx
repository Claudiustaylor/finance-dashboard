"use client";

import * as React from "react";
import { Image as ImageIcon, Music, ArrowUpRight, MoreHorizontal, FileText, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";

const txns = [
  { id: 1, name: "Figma subscription", category: "Software", amount: -45.0, icon: ImageIcon },
  { id: 2, name: "Spotify", category: "Entertainment", amount: -9.99, icon: Music },
  { id: 3, name: "Stripe payout", category: "Revenue", amount: 1240.0, icon: ArrowUpRight, positive: true },
  { id: 4, name: "AWS hosting", category: "Cloud", amount: -284.5, icon: FileText },
  { id: 5, name: "Client invoice", category: "Revenue", amount: 3500.0, icon: Clapperboard, positive: true },
];

export function TransactionHistory() {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">Transactions</span>
        <button className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <MoreHorizontal className="size-4" />
        </button>
      </div>
      <div className="space-y-3">
        {txns.map((t) => (
          <div key={t.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full",
                  t.positive ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600"
                )}
              >
                <Icon icon={t.icon} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-500">{t.category}</p>
              </div>
            </div>
            <span
              className={cn(
                "text-sm font-semibold",
                t.positive ? "text-emerald-600" : "text-slate-900"
              )}
            >
              {t.positive ? "+" : ""}${Math.abs(t.amount).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Icon({ icon }: { icon: React.ComponentType<{ className?: string }> }) {
  const LucideIcon = icon;
  return <LucideIcon className="size-4" />;
}
