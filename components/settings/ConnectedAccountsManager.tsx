"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, RefreshCw, Building2, CreditCard, Wallet, Landmark, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

interface PlaidAccount {
  id: string;
  name: string;
  official_name?: string | null;
  type: string;
  subtype?: string | null;
  mask?: string | null;
  current_balance: number;
  available_balance?: number | null;
  plaid_item_id: string;
  is_active: boolean;
}

interface PlaidItem {
  id: string;
  plaid_item_id: string;
  institution_id?: string | null;
  institution_name?: string | null;
  status: string;
  last_synced_at?: string | null;
  error_message?: string | null;
  created_at: string;
}

interface Props {
  userId?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  depository: Wallet,
  credit: CreditCard,
  loan: Landmark,
  investment: Building2,
  other: Building2,
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function ConnectedAccountsManager({ userId, open, onOpenChange }: Props) {
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const uid = userId || (typeof window !== "undefined" ? localStorage.getItem("titan_user_id") : null);

  async function load() {
    if (!uid) return;
    setLoading(true);
    try {
      const res = await fetch("/api/accounts", { headers: { "x-titan-user-id": uid } });
      const data = await res.json();
      setItems(data.plaidItems || []);
      setAccounts(data.accounts || []);
    } catch (err) {
      console.error("Failed to load accounts", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [uid]);

  async function disconnect(itemId: string) {
    if (!uid) return;
    setDisconnecting(itemId);
    try {
      const res = await fetch(`/api/plaid/items/${itemId}`, { method: "DELETE", headers: { "x-titan-user-id": uid } });
      if (res.ok) {
        await load();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to disconnect account.");
      }
    } finally {
      setDisconnecting(null);
    }
  }

  async function sync() {
    if (!uid) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/plaid/sync", { method: "POST", headers: { "x-titan-user-id": uid } });
      const data = await res.json();
      if (res.ok) {
        await load();
      } else {
        alert(data.error || "Sync failed.");
      }
    } finally {
      setSyncing(false);
    }
  }

  const accountsByItem = (itemId: string) => accounts.filter((a) => a.plaid_item_id === itemId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Connected Accounts</SheetTitle>
          <SheetDescription>
            Manage your linked banks and accounts. Disconnecting a bank will stop syncing transactions.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-2">
            <Button onClick={sync} disabled={syncing} variant="outline" className="flex-1 rounded-full">
              {syncing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
              Sync now
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <Building2 className="mx-auto size-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No banks connected yet.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{item.institution_name || "Unknown bank"}</h3>
                    <p className="text-xs text-slate-500">
                      {item.status === "active" ? "Connected" : item.status}
                      {item.last_synced_at ? ` · Synced ${new Date(item.last_synced_at).toLocaleString()}` : ""}
                    </p>
                    {item.error_message && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-rose-500">
                        <AlertCircle className="size-3" /> {item.error_message}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                    disabled={disconnecting === item.id}
                    onClick={() => disconnect(item.id)}
                  >
                    {disconnecting === item.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </Button>
                </div>

                <div className="space-y-2">
                  {accountsByItem(item.id).map((acct) => {
                    const Icon = ICONS[acct.type] || ICONS.other;
                    return (
                      <div key={acct.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-full bg-white text-[#0071c5] shadow-sm">
                            <Icon className="size-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{acct.name}</p>
                            <p className="text-xs text-slate-500 capitalize">
                              {acct.subtype || acct.type} {acct.mask ? `••••${acct.mask}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">{formatMoney(acct.current_balance)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
