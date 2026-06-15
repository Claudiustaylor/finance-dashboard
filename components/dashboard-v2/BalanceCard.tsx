"use client";

import { useState } from "react";
import { Eye, EyeOff, Plus, SendHorizontal, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";

interface BalanceCardProps {
  balance?: number;
  changePercent?: number;
  currency?: string;
  loading?: boolean;
}

const MINI_BARS = [18, 28, 14, 36, 22, 40, 26, 44, 34, 52, 30, 48];

type SheetMode = "add" | "send" | "request" | null;

function formatMoney(n: number, currencyCode = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(n);
}

export function BalanceCard({
  balance = 0,
  changePercent = 0,
  currency = "USD",
  loading = false,
}: BalanceCardProps) {
  const [hidden, setHidden] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mode, setMode] = useState<SheetMode>(null);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [note, setNote] = useState("");
  const [mockLog, setMockLog] = useState<Array<{ type: string; amount: number; recipient: string; note: string; at: string }>>([]);

  const formatted = hidden
    ? "••••••••"
    : balance.toLocaleString("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      });

  function open(m: Exclude<SheetMode, null>) {
    setMode(m);
    setSheetOpen(true);
    setAmount("");
    setRecipient("");
    setNote("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!n || n <= 0) return;
    const label = mode === "add" ? "Deposited" : mode === "send" ? "Sent" : "Requested";
    setMockLog((prev) => [
      ...prev,
      { type: label, amount: n, recipient: recipient || "Self", note, at: new Date().toLocaleString() },
    ]);
    setAmount("");
    setRecipient("");
    setNote("");
    setSheetOpen(false);
    // Simple toast substitute
    if (typeof window !== "undefined") {
      window.alert(`${label} ${formatMoney(n, currency)} ${mode === "add" ? "recorded" : mode === "send" ? "to" : "from"} ${recipient || "Self"} (mock)`);
    }
  }

  const modeTitle = mode === "add" ? "Add Money" : mode === "send" ? "Send Money" : "Request Money";
  const modeDesc = mode === "add"
    ? "Record a manual deposit intention. No real bank transfer occurs."
    : mode === "send"
    ? "Record a mock transfer to another person or account."
    : "Record a mock payment request from another person or account.";

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-white p-5 sm:p-6 shadow-[0_2px_24px_-6px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
        {/* Mini decorative bar chart */}
        <div className="pointer-events-none absolute right-3 top-10 flex items-end gap-[3px] opacity-80">
          {MINI_BARS.map((h, i) => (
            <div
              key={i}
              className={cn(
                "w-[5px] rounded-t-sm",
                i % 3 === 0 ? "bg-[#00aeef]" : "bg-[#0071c5]",
                i % 5 === 0 && "bg-emerald-400"
              )}
              style={{ height: `${h * 0.9}px` }}
            />
          ))}
        </div>

        <div className="flex items-start justify-between pr-2">
          <div>
            <p className="text-sm font-medium text-slate-500">Total balance</p>
            {loading ? (
              <div className="mt-2 h-9 w-40 animate-pulse rounded-lg bg-slate-100" />
            ) : (
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {formatted}
              </p>
            )}
          </div>
          <button
            onClick={() => setHidden((v) => !v)}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
          <span className="flex size-5 items-center justify-center rounded-full bg-emerald-500 text-white">
            <svg
              className="size-2.5 text-white"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 2v8M2 6l4-4 4 4" />
            </svg>
          </span>
          {changePercent >= 0 ? "+" : ""}
          {changePercent}% Balance increase, Good progress.
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            onClick={() => open("add")}
            size="sm"
            className="rounded-full bg-[#0071c5] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#005fa6]"
          >
            <Plus className="size-3.5" />
            Add Money
          </Button>
          <Button
            onClick={() => open("send")}
            size="sm"
            className="rounded-full bg-slate-900 px-4 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <SendHorizontal className="size-3.5" />
            Send Money
          </Button>
          <Button
            onClick={() => open("request")}
            size="sm"
            variant="outline"
            className="rounded-full border-slate-200 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <HandCoins className="size-3.5" />
            Request Money
          </Button>
        </div>

        {mockLog.length > 0 && (
          <div className="mt-5 rounded-2xl bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold text-slate-500">Recent activity</p>
            <div className="space-y-2">
              {mockLog.slice(-3).reverse().map((entry, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700">
                    {entry.type} {formatMoney(entry.amount, currency)} {entry.type === "Deposited" ? "via" : entry.type === "Sent" ? "to" : "from"} {entry.recipient}
                  </span>
                  <span className="text-slate-400">{entry.at}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{modeTitle}</SheetTitle>
            <SheetDescription>{modeDesc}</SheetDescription>
          </SheetHeader>

          <form onSubmit={submit} className="flex flex-1 flex-col gap-4 px-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="b-amount">Amount</Label>
              <Input
                id="b-amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {mode !== "add" && (
              <div className="space-y-1.5">
                <Label htmlFor="b-recipient">{mode === "send" ? "Recipient" : "Request from"}</Label>
                <Input
                  id="b-recipient"
                  type="text"
                  required
                  placeholder="Name or email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="b-note">Note (optional)</Label>
              <Input
                id="b-note"
                type="text"
                placeholder="What's this for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <SheetFooter className="mt-auto">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setSheetOpen(false)}>Cancel</Button>
              <Button type="submit" className="w-full bg-[#0071c5] text-white hover:bg-[#005fa6] sm:w-auto">
                {mode === "add" ? "Record deposit" : mode === "send" ? "Send" : "Request"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
