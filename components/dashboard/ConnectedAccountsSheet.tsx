"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Shield, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { RepairConnectionButton } from "./RepairConnectionButton";

interface PlaidItem {
  id: string;
  institution_name: string;
  plaid_institution_id: string;
  status: string;
  created_at: string;
  last_synced_at: string | null;
  error_code: string | null;
  error_message: string | null;
}

interface Props {
  userId?: string;
  onChange?: () => void;
}

export function ConnectedAccountsSheet({ userId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plaid/connections", {
        headers: { "x-titan-user-id": userId || "" },
      });
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error("Failed to load connections", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const disconnect = async (itemId: string) => {
    setDisconnectingId(itemId);
    try {
      const res = await fetch(`/api/plaid/disconnect?itemId=${encodeURIComponent(itemId)}`, {
        method: "DELETE",
        headers: { "x-titan-user-id": userId || "" },
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        onChange?.();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to disconnect");
      }
    } finally {
      setDisconnectingId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
          <SettingsIcon className="size-4" />
          Settings
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-md bg-white p-0 text-slate-900">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-base font-semibold">Connected Accounts</SheetTitle>
              <SheetClose>
                <Button variant="ghost" size="icon-sm" className="text-slate-500">
                  <X className="size-4" />
                </Button>
              </SheetClose>
            </div>
            <p className="text-sm text-slate-500">Manage bank connections and repair consent.</p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-5 animate-spin text-slate-400" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                No bank accounts connected yet.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-slate-900">
                          {item.institution_name || "Unknown Bank"}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {item.plaid_institution_id} · {item.status}
                        </p>
                        {item.error_code && (
                          <p className="mt-1 text-xs text-amber-600">
                            {item.error_message || item.error_code}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => disconnect(item.id)}
                        disabled={disconnectingId === item.id}
                        className="shrink-0 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {disconnectingId === item.id ? "..." : "Disconnect"}
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="text-xs text-slate-400">
                        {item.last_synced_at
                          ? `Last synced ${new Date(item.last_synced_at).toLocaleString()}`
                          : "Never synced"}
                      </span>
                      <RepairConnectionButton
                        itemId={item.id}
                        userId={userId}
                        onSuccess={() => {
                          load();
                          onChange?.();
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 p-4 text-xs text-slate-500">
            <div className="mb-2 flex items-center gap-1.5">
              <Shield className="size-3.5" />
              <span className="font-medium text-slate-700">Security note</span>
            </div>
            Disconnecting a bank removes its accounts and transactions from Titan. This does not close the account at your bank.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
