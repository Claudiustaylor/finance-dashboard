"use client";

import { useState } from "react";
import { ReceiptCamera } from "@/components/receipts/ReceiptCamera";
import { ReceiptList } from "@/components/receipts/ReceiptList";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ReceiptsPage() {
  const [refresh, setRefresh] = useState("");

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900">
            <ArrowLeft className="size-4" /> Back
          </Link>
          <h1 className="text-base font-semibold">Receipts</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-4 pb-24">
        <ReceiptCamera onProcessed={() => setRefresh(Date.now().toString())} />
        <ReceiptList refresh={refresh} />
      </main>
    </div>
  );
}
