"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Landmark,
  Loader2,
  RefreshCw,
  Settings,
  Unlink,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddAccountButton } from "@/components/dashboard/AddAccountButton";

interface PlaidItem {
  id: string;
  institution_name: string;
  status: string;
  last_synced_at?: string;
  created_at?: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  current_balance: number;
  available_balance?: number;
  mask?: string;
  plaid_item_id: string;
  is_active: boolean;
}

function formatCurrency(n: number) {
  return `$${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

function timeSince(dateStr?: string) {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  depository: <Wallet className="size-5" />,
  credit: <CreditCard className="size-5" />,
  loan: <Landmark className="size-5" />,
  investment: <Building2 className="size-5" />,
};

const TYPE_COLORS: Record<string, string> = {
  depository: "text-[#0071c5]",
  credit: "text-[#00aeef]",
  loan: "text-amber-500",
  investment: "text-emerald-500",
};

const BG_COLORS: Record<string, string> = {
  depository: "bg-[#0071c5]/10",
  credit: "bg-[#00aeef]/10",
  loan: "bg-amber-500/10",
  investment: "bg-emerald-500/10",
};

function institutionColor(name: string) {
  const colors = [
    "border-[#0071c5]/20",
    "border-[#00aeef]/20",
    "border-emerald-500/20",
    "border-amber-500/20",
    "border-violet-500/20",
    "border-rose-500/20",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * 31) % colors.length;
  return colors[h];
}

function institutionBg(name: string) {
  const colors = [
    "bg-[#0071c5]/5",
    "bg-[#00aeef]/5",
    "bg-emerald-500/5",
    "bg-amber-500/5",
    "bg-violet-500/5",
    "bg-rose-500/5",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * 31) % colors.length;
  return colors[h];
}

export default function SettingsAccountsPage() {
  const [items, setItems] = useState<PlaidItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // initial value depends only on empty initial data; component re-init will handle loaded data
    return new Set();
  });
  const [disconnecting, setDisconnecting] = useState<Set<string>>(new Set());
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    try {
      const sb = supabaseAdmin();
      const [{ data: accts }, { data: itms }] = await Promise.all([
        sb.from("accounts").select("*").order("created_at", { ascending: false }),
        sb.from("plaid_items").select("*").neq("status", "disconnected").order("created_at", { ascending: false }),
      ]);
      setAccounts(accts || []);
      setItems(itms || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const groups = useMemo(() => {
    const map: Record<string, { item: PlaidItem; accounts: Account[] }> = {};
    for (const acct of accounts) {
      const item = items.find((p) => p.id === acct.plaid_item_id);
      const inst = item?.institution_name || "Unknown Bank";
      if (!map[inst]) {
        map[inst] = { item: item || { id: acct.plaid_item_id, institution_name: inst, status: "unknown" }, accounts: [] };
      }
      map[inst].accounts.push(acct);
    }
    return map;
  }, [accounts, items]);

  // Auto-expand when only one institution loads; schedule with timeout to avoid sync setState warning
  useEffect(() => {
    if (!loading && Object.keys(groups).length === 1 && expanded.size === 0) {
      const id = setTimeout(() => setExpanded(new Set(Object.keys(groups))), 0);
      return () => clearTimeout(id);
    }
  }, [groups, expanded.size, loading]);

  const toggle = (inst: string) => {
    const next = new Set(expanded);
    if (next.has(inst)) next.delete(inst);
    else next.add(inst);
    setExpanded(next);
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const disconnect = async (itemId: string) => {
    setDisconnecting((prev) => new Set(prev).add(itemId));
    try {
      const res = await fetch(`/api/plaid/items/${itemId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Disconnect failed");
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setAccounts((prev) => prev.filter((a) => a.plaid_item_id !== itemId));
      showToast("Bank disconnected");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Disconnect failed");
    } finally {
      setDisconnecting((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const toggleAccount = async (acct: Account) => {
    setToggling((prev) => new Set(prev).add(acct.id));
    try {
      const nextState = !acct.is_active;
      const res = await fetch(`/api/accounts/${acct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: nextState }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Update failed");
      setAccounts((prev) => prev.map((a) => (a.id === acct.id ? { ...a, is_active: nextState } : a)));
      showToast(nextState ? "Account activated" : "Account deactivated");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Update failed");
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(acct.id);
        return next;
      });
    }
  };

  const activeItems = items.filter((i) => i.status !== "disconnected");
  const activeAccounts = accounts.filter((a) => a.is_active);
  const totalBalance = activeAccounts.reduce((s, a) => s + Number(a.current_balance || 0), 0);

  return (
    <div className="dashboard-light min-h-screen bg-[#f4f6f8] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <AddAccountButton label="Connect Bank" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Settings</p>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Connected accounts</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your linked banks and the accounts under each one.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <Settings className="size-4" />
              Settings home
            </Link>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="dashboard-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Connected banks</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{activeItems.length}</p>
          </div>
          <div className="dashboard-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total accounts</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{activeAccounts.length}</p>
          </div>
          <div className="dashboard-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total balance</p>
            <p className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{formatCurrency(totalBalance)}</p>
          </div>
        </div>

        <div className="dashboard-card p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 className="mr-2 size-5 animate-spin" />
              Loading connected accounts...
            </div>
          ) : Object.keys(groups).length === 0 ? (
            <div className="py-12 text-center">
              <Landmark className="mx-auto size-10 text-slate-300" />
              <h3 className="mt-4 text-base font-semibold text-slate-900">No connected banks</h3>
              <p className="mt-1 text-sm text-slate-500">Connect a bank to get started.</p>
              <div className="mt-5">
                <AddAccountButton label="Connect Bank" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groups).map(([instName, group]) => {
                const isExpanded = expanded.has(instName);
                const itemTotal = group.accounts
                  .filter((a) => a.is_active)
                  .reduce((s, a) => s + Number(a.current_balance || 0), 0);
                const synced = timeSince(group.item.last_synced_at);
                const activeCount = group.accounts.filter((a) => a.is_active).length;

                return (
                  <div
                    key={instName}
                    className={`rounded-2xl border ${institutionColor(instName)} ${institutionBg(instName)} overflow-hidden`}
                  >
                    <div
                      className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-white/[0.04]"
                      onClick={() => toggle(instName)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/[0.04]">
                          <Landmark className="size-5 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{instName}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                            <span>
                              {activeCount} active {activeCount === 1 ? "account" : "accounts"}
                              {group.accounts.length > activeCount && ` / ${group.accounts.length} total`}
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <RefreshCw className="size-3" />
                              {synced}
                            </span>
                            <span>·</span>
                            <span className="capitalize">{group.item.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="hidden text-base font-bold text-slate-900 tabular-nums sm:block">
                          {formatCurrency(itemTotal)}
                        </p>
                        {isExpanded ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-slate-200/60 p-3 sm:p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Accounts</p>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => disconnect(group.item.id)}
                            disabled={disconnecting.has(group.item.id)}
                          >
                            {disconnecting.has(group.item.id) ? (
                              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                            ) : (
                              <Unlink className="mr-1.5 size-3.5" />
                            )}
                            Disconnect bank
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {group.accounts.map((acct) => {
                            const icon = TYPE_ICONS[acct.type] || <Building2 className="size-5" />;
                            const textColor = TYPE_COLORS[acct.type] || "text-slate-400";
                            const bgColor = BG_COLORS[acct.type] || "bg-slate-100";
                            return (
                              <div
                                key={acct.id}
                                className={`flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-opacity sm:flex-row sm:items-center sm:justify-between ${!acct.is_active ? "opacity-60" : ""}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`flex size-10 items-center justify-center rounded-lg ${bgColor}`}>
                                    <div className={textColor}>{icon}</div>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">{acct.name}</p>
                                    <p className="text-xs text-slate-500">
                                      {acct.subtype || acct.type}
                                      {acct.mask ? ` ••••${acct.mask}` : ""}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-4 sm:justify-end">
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-slate-900 tabular-nums">
                                      {formatCurrency(acct.current_balance)}
                                    </p>
                                    {acct.available_balance !== undefined && acct.available_balance !== acct.current_balance && (
                                      <p className="text-xs text-slate-500">
                                        Available {formatCurrency(acct.available_balance)}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    variant={acct.is_active ? "outline" : "secondary"}
                                    size="sm"
                                    onClick={() => toggleAccount(acct)}
                                    disabled={toggling.has(acct.id)}
                                  >
                                    {toggling.has(acct.id) && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                                    {acct.is_active ? "Deactivate" : "Activate"}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg ring-1 ring-black/[0.04]">
          <p className="text-sm font-medium text-slate-900">{toast}</p>
        </div>
      )}
    </div>
  );
}
