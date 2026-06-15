"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, CreditCard, Wallet, Landmark, Loader2, RefreshCw, Trash2, AlertCircle, Plus } from "lucide-react";
import { RepairConnectionButton } from "@/components/dashboard/RepairConnectionButton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

export default function SettingsAccountsPage() {
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const uid = typeof window !== "undefined" ? localStorage.getItem("titan_user_id") : null;

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
      toast.error("Could not load connected accounts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [uid]);

  async function disconnect(itemId: string, institutionName?: string | null) {
    if (!uid) return;
    const confirmed = window.confirm(`Disconnect ${institutionName || "this bank"}? This will stop syncing transactions and hide its accounts from the dashboard.`);
    if (!confirmed) return;
    setDisconnecting(itemId);
    try {
      const res = await fetch(`/api/plaid/items/${itemId}`, { method: "DELETE", headers: { "x-titan-user-id": uid } });
      if (res.ok) {
        toast.success("Bank disconnected.");
        await load();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to disconnect account.");
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
        toast.success(`Synced ${data.accounts || 0} accounts · ${data.transactions || 0} transactions`);
        await load();
      } else {
        toast.error(data.error || "Sync failed.");
      }
    } catch (err: any) {
      toast.error(err.message || "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  const accountsByItem = (itemId: string) => accounts.filter((a) => a.plaid_item_id === itemId);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/dashboard" className="rounded-full p-2 hover:bg-slate-200">
            <ArrowLeft className="size-5 text-slate-600" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Connected Accounts</h1>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button onClick={sync} disabled={syncing} variant="outline" className="rounded-full">
            {syncing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
            Sync now
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#0071c5] hover:bg-slate-50"
          >
            <Plus className="size-4" /> Connect bank
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <Building2 className="mx-auto size-10 text-slate-300" />
            <p className="mt-3 text-slate-500">No banks connected yet.</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0071c5] px-4 py-2 text-sm font-medium text-white hover:bg-[#005fa6]"
            >
              <Plus className="size-4" /> Connect your first bank
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{item.institution_name || "Unknown bank"}</h2>
                    <p className="text-sm text-slate-500">
                      {item.status === "active" ? "Connected" : item.status}
                      {item.last_synced_at ? ` · Synced ${new Date(item.last_synced_at).toLocaleString()}` : ""}
                    </p>
                    {item.error_message && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-rose-500">
                        <AlertCircle className="size-4" /> {item.error_message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <RepairConnectionButton itemId={item.id} userId={uid || undefined} onSuccess={load} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      disabled={disconnecting === item.id}
                      onClick={() => disconnect(item.id, item.institution_name)}
                    >
                      {disconnecting === item.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      <span className="ml-2">Disconnect</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {accountsByItem(item.id).map((acct) => {
                    const Icon = ICONS[acct.type] || ICONS.other;
                    return (
                      <div key={acct.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-full bg-white text-[#0071c5] shadow-sm">
                            <Icon className="size-5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{acct.name}</p>
                            <p className="text-xs text-slate-500 capitalize">
                              {acct.subtype || acct.type} {acct.mask ? `••••${acct.mask}` : ""}
                            </p>
                          </div>
                        </div>
                        <p className="text-right font-semibold text-slate-900">{formatMoney(acct.current_balance)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
