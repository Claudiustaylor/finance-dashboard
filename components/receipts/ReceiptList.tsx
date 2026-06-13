"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ReceiptIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Receipt {
  id: string;
  file_url?: string;
  extracted_merchant?: string;
  extracted_total?: number;
  extracted_date?: string;
  status: string;
  created_at: string;
}

interface ReceiptListProps {
  userId?: string;
  refresh?: string;
}

export function ReceiptList({ userId, refresh }: ReceiptListProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const uid = userId || localStorage.getItem("titan_user_id");
      if (!uid) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("receipts")
        .select("id, file_url, extracted_merchant, extracted_total, extracted_date, status, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(20);
      setReceipts(data || []);
      setLoading(false);
    }
    load();
  }, [userId, refresh]);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center rounded-3xl bg-white shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
        <Loader2 className="size-6 animate-spin text-[#0071c5]" />
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
        <ReceiptIcon className="mx-auto size-8 text-slate-300" />
        <p className="mt-2 text-sm text-slate-500">No receipts yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-5 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
      <h3 className="mb-4 text-base font-semibold text-slate-900">Recent receipts</h3>
      <div className="divide-y divide-slate-100">
        {receipts.map((r) => (
          <div key={r.id} className="flex items-center gap-3 py-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100">
              <ReceiptIcon className="size-5 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{r.extracted_merchant || "Receipt"}</p>
              <p className="text-xs text-slate-500">{r.extracted_date || new Date(r.created_at).toLocaleDateString()} · ${r.extracted_total?.toFixed(2) || "—"}</p>
            </div>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                r.status === "processed" && "bg-emerald-50 text-emerald-600",
                r.status === "review" && "bg-amber-50 text-amber-600",
                r.status === "pending" && "bg-slate-100 text-slate-600",
                r.status === "failed" && "bg-red-50 text-red-600"
              )}
            >
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
