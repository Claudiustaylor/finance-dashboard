"use client";

import Link from "next/link";
import { Receipt, Bot, ArrowUpRight } from "lucide-react";

interface AiAssistantCardProps {
  onOpenChat?: () => void;
}

export function AiAssistantCard({ onOpenChat }: AiAssistantCardProps) {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-[#0071c5] p-5 text-white shadow-[0_2px_24px_-6px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-[360px]">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide">
            <Bot className="size-3.5" />
            AI Assistant
          </div>
          <p className="text-base font-semibold">Ask your books anything.</p>
          <p className="text-sm text-white/80">
            “What changed in software expenses this quarter?”
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/receipts"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/25"
          >
            <Receipt className="size-3.5" />
            Capture Receipt
          </Link>
          <button
            onClick={onOpenChat}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#0071c5] transition hover:bg-slate-50"
          >
            Open Chat
            <ArrowUpRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
