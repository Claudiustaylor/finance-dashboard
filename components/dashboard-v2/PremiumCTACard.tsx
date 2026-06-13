"use client";

import { Sparkles, ArrowRight, TrendingUp, Bot, ShieldCheck, Receipt } from "lucide-react";

export function PremiumCTACard() {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-[#0071c5] to-[#00aeef] p-5 text-white shadow-[0_2px_24px_-6px_rgba(0,0,0,0.12)]">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="size-5" />
        <span className="text-sm font-bold">Premium</span>
      </div>
      <p className="mb-2 text-base font-semibold">Unlock AI bookkeeping</p>
      <ul className="mb-5 space-y-1.5 text-xs text-white/90">
        <li className="flex items-center gap-1.5">
          <Bot className="size-3.5" /> AI categorization
        </li>
        <li className="flex items-center gap-1.5">
          <Receipt className="size-3.5" /> Receipt OCR + matching
        </li>
        <li className="flex items-center gap-1.5">
          <ShieldCheck className="size-3.5" /> Automated reconciliation
        </li>
        <li className="flex items-center gap-1.5">
          <TrendingUp className="size-3.5" /> Burn rate + runway
        </li>
      </ul>
      <button className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0071c5] transition hover:bg-slate-50">
        Upgrade now
        <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
}
