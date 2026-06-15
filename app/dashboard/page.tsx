"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw, Bell, Settings, Shield, BellRing, CreditCard, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { AddAccountButton } from "@/components/dashboard/AddAccountButton";
import { ConnectedAccountsSheet } from "@/components/dashboard/ConnectedAccountsSheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import {
  BalanceCard,
  IncomeCard,
  ExpenseCard,
  CreditCardExpenseCard,
  GoalsCard,
  CashflowChart,
  TransactionHistory,
  FinancialReportCard,
  TodayReceived,
  AiChatDrawer,
  RealtimeReports,
  AiAssistantCard,
} from "@/components/dashboard-v2";
import { useTitanUserId } from "@/hooks/useTitanUserId";
import { supabase } from "@/lib/supabase";

interface Report {
  total_balance?: number;
  income_90d?: number;
  expense_90d?: number;
  monthly_burn?: number;
  runway_months?: number | null;
  cash_flow?: { name: string; income: number; expense: number }[];
  account_count?: number;
  transaction_count_90d?: number;
  today_received?: number;
  unpaid_invoices?: number;
  credit_card_expense_90d?: number;
  checking_expense_90d?: number;
  balance_change_percent?: number;
  income_change?: number;
  income_change_percent?: number;
  expense_change?: number;
  expense_change_percent?: number;
}

interface Account {
  id: string;
  type: string;
  subtype?: string;
  current_balance?: number;
}

interface PlaidItem {
  id: string;
  institution_name: string;
  status: string;
  last_synced_at?: string;
}

interface Notification {
  id: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  time: string;
  unread: boolean;
}

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      icon: <BellRing className="size-4 text-[#0071c5]" />,
      title: "Sync completed",
      body: "Your Chase account finished syncing 42 transactions.",
      time: "2 min ago",
      unread: true,
    },
    {
      id: "2",
      icon: <CreditCard className="size-4 text-rose-500" />,
      title: "Large expense detected",
      body: "A $340 charge was categorized under Travel.",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: "3",
      icon: <FileCheck className="size-4 text-emerald-500" />,
      title: "Report ready",
      body: "Your monthly financial report is ready to print.",
      time: "Yesterday",
      unread: false,
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        aria-label="Open notifications"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <BellRing className="size-4 text-[#0071c5]" />
              Notifications
            </SheetTitle>
            <SheetDescription>
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-2 px-4 py-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex gap-3 rounded-xl border p-3 transition",
                  n.unread ? "border-slate-100 bg-slate-50" : "border-transparent bg-white"
                )}
              >
                <div className="mt-0.5 shrink-0">{n.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    {n.title}
                    {n.unread && <span className="size-2 rounded-full bg-[#0071c5]" />}
                  </p>
                  <p className="text-xs text-slate-600">{n.body}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{n.time}</p>
                </div>
              </div>
            ))}
          </div>

          <SheetFooter>
            <Button
              variant="outline"
              onClick={markAllRead}
              className="w-full"
            >
              Mark all as read
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setOpen(false)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}


function SyncButton({ userId }: { userId?: string | null }) {
  const [syncing, setSyncing] = useState(false);
  async function sync() {
    if (!userId || syncing) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/plaid/sync", {
        method: "POST",
        headers: { "x-titan-user-id": userId },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Synced ${data.accounts || 0} accounts · ${data.transactions || 0} transactions`);
        window.location.reload();
      } else {
        toast.error(data.error || "Sync failed.");
      }
    } catch (err: any) {
      toast.error(err.message || "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }
  return (
    <button
      onClick={sync}
      disabled={syncing}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50"
    >
      <RefreshCw className={cn("size-3.5", syncing && "animate-spin")} />
      <span className="hidden sm:inline">{syncing ? "Syncing..." : "Sync"}</span>
    </button>
  );
}

function DashboardContent() {
  const [chatOpen, setChatOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [plaidItems, setPlaidItems] = useState<PlaidItem[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const { userId, loading: userLoading } = useTitanUserId();

  useEffect(() => {
    async function loadAccounts() {
      const { data: accts } = await supabase
        .from("accounts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      const { data: items } = await supabase
        .from("plaid_items")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      setAccounts(accts || []);
      setPlaidItems(items || []);
    }
    loadAccounts();
  }, []);

  useEffect(() => {
    async function loadReport() {
      if (userLoading || !userId) return;
      try {
        const res = await fetch("/api/reports/realtime", {
          headers: { "x-titan-user-id": userId },
        });
        const data = await res.json();
        setReport(data);
      } catch (err) {
        console.error("Failed to load realtime report", err);
      } finally {
        setReportLoading(false);
      }
    }
    loadReport();
  }, [userId, userLoading]);

  const totalBalance = report?.total_balance ?? 0;
  const income90d = report?.income_90d ?? 0;
  const expense90d = report?.expense_90d ?? 0;
  const monthlyBurn = report?.monthly_burn ?? 0;
  const runway = report?.runway_months ?? null;
  const cashFlow = report?.cash_flow ?? [];

  return (
    <div className="dashboard-light min-h-screen bg-[#f4f6f8] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-900"
            >
              <ArrowLeft className="size-4" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 32 32" className="size-6">
                <rect x="2" y="2" width="28" height="28" rx="6" fill="#0071c5" opacity="0.9" />
                <path d="M10 8 h12 v3 h-4.5 v13 h-3 v-13 h-4.5 z" fill="white" />
              </svg>
              <span className="text-sm font-semibold text-slate-900">Titan Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <AddAccountButton data-connect-bank="true" />
            <SyncButton userId={userId || undefined} />
            <NotificationsBell />
            <ConnectedAccountsSheet userId={userId || undefined} />
            <Link
              href="/settings/accounts"
              className="hidden rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:inline-flex"
            >
              <Settings className="size-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:mb-8">
          <div>
            <p className="text-sm text-slate-500">Welcome back</p>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Claudius</h1>
          </div>
          <Link
            href="/compliance"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <Shield className="size-4" />
            Compliance Center
          </Link>
        </div>

        <div className="mb-4">
          <RealtimeReports report={report} loading={reportLoading} />
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <BalanceCard balance={totalBalance} changePercent={report?.balance_change_percent ?? 0} loading={reportLoading} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            <IncomeCard
              total={income90d}
              change={report?.income_change ?? 0}
              changePercent={report?.income_change_percent ?? 0}
              loading={reportLoading}
            />
            <ExpenseCard expense={expense90d} change={report?.expense_change ?? 0} changePercent={report?.expense_change_percent ?? 0} loading={reportLoading} />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <GoalsCard />
          </div>
          <div className="lg:col-span-5">
            <CashflowChart data={cashFlow} />
          </div>
          <div className="lg:col-span-3">
            <TransactionHistory userId={userId || undefined} />
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TodayReceived todayReceived={report?.today_received ?? 0} unpaidInvoices={report?.unpaid_invoices ?? 0} loading={reportLoading} />
          <CreditCardExpenseCard
            amount={report?.credit_card_expense_90d ?? 0}
            accountCount={accounts.filter((a) => String(a.subtype).toLowerCase().includes("credit") || String(a.type).toLowerCase().includes("credit")).length}
            loading={reportLoading}
            onConnect={() => {
              const btn = document.querySelector('[data-connect-bank]') as HTMLButtonElement;
              btn?.click();
            }}
          />
          <div className="sm:col-span-1 lg:col-span-2">
            <FinancialReportCard report={report} />
          </div>
        </div>

        <AiAssistantCard onOpenChat={() => setChatOpen(true)} />

        <AiChatDrawer open={chatOpen} onOpenChange={setChatOpen} userId={userId || undefined} />

        <footer className="mt-10 border-t border-slate-200/70 pt-6">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 32 32" className="size-4">
                <rect x="2" y="2" width="28" height="28" rx="6" fill="#0071c5" opacity="0.6" />
                <path d="M10 8 h12 v3 h-4.5 v13 h-3 v-13 h-4.5 z" fill="white" />
              </svg>
              <span className="text-xs text-slate-500">
                Titan Finance · {plaidItems?.length || 0} bank connected
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/settings/accounts"
                className="text-xs text-slate-500 transition hover:text-slate-900"
              >
                Settings
              </Link>
              <Link
                href="/compliance"
                className="text-xs text-[#0071c5] transition hover:text-[#00aeef]"
              >
                Compliance Center
              </Link>
              <Link
                href="/"
                className="text-xs text-slate-500 transition hover:text-slate-900"
              >
                Back to home
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
