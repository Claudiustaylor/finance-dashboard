"use client";

import { useMemo, useState } from "react";
import { Wand2, Tag, Check, AlertCircle } from "lucide-react";

interface Transaction {
  id: string;
  name: string;
  merchant_name?: string | null;
  amount: number;
  plaid_category?: string[] | null;
  suggested_category?: string;
}

interface Props {
  transactions: Transaction[];
}

// ── Smart mapping rules (heuristic overlay on Plaid categories) ──
const VENDOR_MAP: Record<string, string> = {
  "starbucks": "Dining", "dunkin": "Dining", "chipotle": "Dining", "mcdonald": "Dining",
  "panera": "Dining", "subway": "Dining", "taco bell": "Dining",
  "wendys": "Dining", "pizza": "Dining", "grubhub": "Dining", "uber eats": "Dining",
  "doordash": "Dining", "seamless": "Dining", "restaurant": "Dining",
  "shell": "Transportation", "exxon": "Transportation", "bp ": "Transportation",
  "chevron": "Transportation", "mobil": "Transportation", "texaco": "Transportation",
  "arco": "Transportation", "speedway": "Transportation", "costco gas": "Transportation",
  "uber trip": "Transportation", "lyft": "Transportation", "mta": "Transportation",
  "shell oil": "Transportation", "gas": "Transportation",
  "whole foods": "Groceries", "trader joe": "Groceries", "kroger": "Groceries",
  "aldi": "Groceries", "publix": "Groceries", "safeway": "Groceries",
  "shoprite": "Groceries", "wegmans": "Groceries", "costco": "Groceries",
  "walmart": "Shopping", "target": "Shopping", "amazon": "Shopping",
  "best buy": "Shopping", "home depot": "Shopping", "lowes": "Shopping",
  "ikea": "Shopping", "apple store": "Shopping",
  "hulu": "Entertainment", "netflix": "Entertainment", "spotify": "Entertainment",
  "disney+": "Entertainment", "disney plus": "Entertainment", "max": "Entertainment",
  "hbo": "Entertainment", "peacock": "Entertainment", "paramount": "Entertainment",
  "amc": "Entertainment", "regal": "Entertainment", "stubhub": "Entertainment",
  "comcast": "Bills", "verizon": "Bills", "at&t": "Bills", "tmobile": "Bills",
  "sprint": "Bills", "xfinity": "Bills", "spectrum": "Bills", "electric": "Bills",
  "water bill": "Bills", "insurance": "Bills", "state farm": "Bills",
  "blue cross": "Health", "cigna": "Health", "aetna": "Health", "unitedhealth": "Health",
  "cvs": "Health", "walgreens": "Health", "rite aid": "Health", "hospital": "Health",
  "airbnb": "Travel", "hotel": "Travel", "marriott": "Travel", "hilton": "Travel",
  "delta": "Travel", "united air": "Travel", "american air": "Travel", "southwest": "Travel",
  "expedia": "Travel", "booking.com": "Travel",
};

const PLAID_MAP: Record<string, string> = {
  "Food and Drink": "Dining", "Travel": "Travel", "Transportation": "Transportation",
  "Groceries": "Groceries", "Shops": "Shopping", "Recreation": "Entertainment",
  "Entertainment": "Entertainment", "Healthcare": "Health", "Medical": "Health",
  "Bills and Utilities": "Bills", "Insurance": "Bills", "Transfer": "Transfer",
  "Payment": "Payment", "Interest": "Income",
};

function suggestCategory(tx: Transaction): { category: string; confidence: "high" | "medium" | "low"; source: "vendor" | "plaid" | "fallback" } {
  const search = (tx.merchant_name || tx.name || "").toLowerCase();
  for (const [k, v] of Object.entries(VENDOR_MAP)) {
    if (search.includes(k)) return { category: v, confidence: "high", source: "vendor" };
  }
  const plaid = (tx.plaid_category?.[0] || "").replace(/_/g, " ");
  if (PLAID_MAP[plaid]) return { category: PLAID_MAP[plaid], confidence: "medium", source: "plaid" };
  return { category: tx.amount < 0 ? "Income" : "Uncategorized", confidence: "low", source: "fallback" };
}

interface CategoryStat {
  category: string;
  count: number;
  total: number;
  high: number;
  medium: number;
  low: number;
}

export function TransactionCategorizer({ transactions }: Props) {
  const [appliedMap, setAppliedMap] = useState<Record<string, boolean>>({});

  const stats = useMemo(() => {
    const map = new Map<string, CategoryStat>();
    for (const tx of transactions) {
      if (tx.amount < 0) continue; // skip income for spending analysis
      const s = suggestCategory(tx);
      if (appliedMap[tx.id]) tx.suggested_category = s.category;
      const existing = map.get(s.category) || { category: s.category, count: 0, total: 0, high: 0, medium: 0, low: 0 };
      existing.count++;
      existing.total += tx.amount;
      existing[s.confidence]++;
      map.set(s.category, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [transactions, appliedMap]);

  const applyAll = () => {
    const next: Record<string, boolean> = {};
    for (const tx of transactions) next[tx.id] = true;
    setAppliedMap(next);
  };

  if (!transactions?.length) return null;

  return (
    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-[#0071c5]" />
          <h3 className="text-sm font-semibold text-white">AI Categorization</h3>
        </div>
        <button onClick={applyAll} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0071c5] hover:text-[#00aeef] border border-[#0071c5]/20 rounded-lg hover:bg-[#0071c5]/5 transition-all"
        >
          <Check className="w-3.5 h-3.5" />
          Accept All
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.category} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.10] transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="w-3 h-3 text-[#0071c5]" />
              <span className="text-xs font-medium text-white">{s.category}</span>
            </div>
            <p className="text-lg font-bold text-white tabular-nums">${s.total.toFixed(2)}</p>
            <p className="text-xs text-white/40">{s.count} txs</p>
            {s.low > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span className="text-xs text-amber-400" >{s.low} low confidence</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-white/25">
        Categorization engine uses vendor name matching (high confidence), Plaid category fallback (medium), and amount-based heuristics (low).
        Click Accept All to set suggested_category on transactions.
      </p>
    </div>
  );
}
