"use client";

import { CreditCard, Plus } from "lucide-react";

interface CreditCardExpenseCardProps {
  amount?: number;
  accountCount?: number;
  loading?: boolean;
  onConnect?: () => void;
}

export function CreditCardExpenseCard({
  amount = 0,
  accountCount = 0,
  loading = false,
  onConnect,
}: CreditCardExpenseCardProps) {
  const hasCard = accountCount > 0;

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <CreditCard className="size-4" />
          </div>
          <span className="text-sm font-semibold text-slate-900">Credit card expense</span>
        </div>
        {hasCard && !loading && (
          <span className="text-xs font-medium text-slate-500">{accountCount} card{accountCount === 1 ? "" : "s"}</span>
        )}
      </div>

      {loading ? (
        <div className="mt-2 h-8 w-32 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className="text-2xl font-bold text-slate-900">
          ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </p>
      )}

      {!hasCard && !loading && (
        <div className="mt-4 rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-600">No credit card account connected.</p>
          {onConnect && (
            <button
              onClick={onConnect}
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#0071c5] hover:text-[#00aeef]"
            >
              <Plus className="size-3" />
              Connect a card
            </button>
          )}
        </div>
      )}
    </div>
  );
}
