"use client";

import { useState } from "react";
import { CreditCard, Landmark, Wallet, Building2, ChevronDown, ChevronUp, RefreshCw, Circle } from "lucide-react";

interface PlaidItem {
  id: string;
  institution_name: string;
  last_synced_at?: string;
  status: string;
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
}

interface Props {
  accounts: Account[];
  plaidItems: PlaidItem[];
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  depository: <Wallet className="w-5 h-5" />,
  credit: <CreditCard className="w-5 h-5" />,
  loan: <Landmark className="w-5 h-5" />,
  investment: <Building2 className="w-5 h-5" />,
};

const TYPE_COLORS: Record<string, string> = {
  depository: "text-[#0071c5]",
  credit: "text-[#00aeef]",
  loan: "text-amber-400",
  investment: "text-emerald-400",
};

const BG_COLORS: Record<string, string> = {
  depository: "bg-[#0071c5]/10",
  credit: "bg-[#00aeef]/10",
  loan: "bg-amber-500/10",
  investment: "bg-emerald-500/10",
};

function timeSince(dateStr?: string): string {
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

function institutionColor(name: string): string {
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

function institutionBg(name: string): string {
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

export function ConnectedAccounts({ accounts, plaidItems }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Group accounts by institution
  const groups: Record<string, { item: PlaidItem; accounts: Account[] }> = {};
  for (const acct of accounts) {
    const item = plaidItems.find((p) => p.id === acct.plaid_item_id);
    const inst = item?.institution_name || "Unknown Bank";
    if (!groups[inst]) {
      groups[inst] = { item: item || { id: acct.plaid_item_id, institution_name: inst, status: "unknown" }, accounts: [] };
    }
    groups[inst].accounts.push(acct);
  }

  const toggle = (inst: string) => {
    const next = new Set(expanded);
    if (next.has(inst)) next.delete(inst);
    else next.add(inst);
    setExpanded(next);
  };

  if (!accounts.length) return null;

  return (
    <div className="space-y-3">
      {Object.entries(groups).map(([instName, group]) => {
        const isExpanded = expanded.has(instName) || Object.keys(groups).length === 1;
        const total = group.accounts.reduce((s, a) => s + Number(a.current_balance || 0), 0);
        const synced = timeSince(group.item.last_synced_at);

        return (
          <div
            key={instName}
            className={`rounded-2xl border ${institutionColor(instName)} ${institutionBg(instName)} overflow-hidden`}
          >
            {/* Institution Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
              onClick={() => toggle(instName)}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-white/60" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{instName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-white/40">{group.accounts.length} account{group.accounts.length !== 1 ? "s" : ""}</span>
                    <span className="text-xs text-white/25">·</span>
                    <span className="flex items-center gap-1 text-xs text-white/40">
                      <RefreshCw className="w-3 h-3" />
                      {synced}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-bold text-white tabular-nums">
                  ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
                {Object.keys(groups).length > 1 && (
                  isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />
                )}
              </div>
            </div>

            {/* Accounts */}
            {isExpanded && (
              <div className="border-t border-white/[0.04] p-3 space-y-2">
                {group.accounts.map((acct) => {
                  const icon = TYPE_ICONS[acct.type] || <Building2 className="w-5 h-5" />;
                  const textColor = TYPE_COLORS[acct.type] || "text-white/40";
                  const bgColor = BG_COLORS[acct.type] || "bg-white/[0.02]";
                  return (
                    <div
                      key={acct.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
                          <div className={textColor}>{icon}</div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{acct.name}</p>
                          <p className="text-xs text-white/40">
                            {acct.subtype || acct.type}
                            {acct.mask ? ` ••••${acct.mask}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-white tabular-nums">
                          ${Number(acct.current_balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                        {acct.available_balance !== undefined && acct.available_balance !== acct.current_balance && (
                          <p className="text-xs text-white/30">
                            Available: ${Number(acct.available_balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
