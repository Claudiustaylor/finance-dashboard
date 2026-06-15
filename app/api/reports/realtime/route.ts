import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeUserId } from '@/lib/user-id';

function getUserId(req: NextRequest): string | null {
  return normalizeUserId(req.headers.get("x-titan-user-id") || req.headers.get("x-user-id"));
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 401 });

    const sb = supabaseAdmin();
    const { data: accounts } = await sb
      .from("accounts")
      .select("id, current_balance, type, subtype")
      .eq("user_id", userId)
      .eq("is_active", true);
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];
    const { data: txRows, error: txError } = await sb
      .from("transactions")
      .select("id, amount, date, category_id, pending, account_id, name, merchant_name, accounts:account_id(type, subtype)")
      .eq("user_id", userId)
      .gte("date", cutoff)
      .order("date", { ascending: true });

    if (txError) {
      console.error("Realtime report transaction query error:", txError);
    }

    // Join account type/subtype onto each transaction from the accounts map
    const accountMap: Record<string, { type?: string; subtype?: string }> = {};
    (accounts || []).forEach((a: any) => {
      accountMap[a.id] = { type: a.type, subtype: a.subtype };
    });
    const transactions = (txRows || []).map((t: any) => ({
      ...t,
      accounts: accountMap[t.account_id] || {},
    }));

    const totalBalance = (accounts || []).reduce((sum, a) => sum + Number(a.current_balance || 0), 0);

    const income = transactions
      .filter((t) => Number(t.amount) < 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);
    const expense = transactions
      .filter((t) => Number(t.amount) > 0)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);

    // Split by account type/subtype for cards
    const creditCardExpense = transactions
      .filter((t) => Number(t.amount) > 0 && (String(t.accounts?.subtype).toLowerCase().includes("credit") || String(t.accounts?.type).toLowerCase().includes("credit")))
      .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);
    const checkingExpense = transactions
      .filter((t) => Number(t.amount) > 0 && (String(t.accounts?.subtype).toLowerCase().includes("checking") || String(t.accounts?.type).toLowerCase().includes("depository")))
      .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);

    // Income is kept as a single metric; no fabricated salary/freelance split.

    // Burn rate = last 30 days net outflow averaged daily, multiplied to monthly
    const last30 = transactions.filter((t) => new Date(t.date) >= new Date(Date.now() - 30 * 86400000));
    const net30 = last30.reduce(
      (sum, t) => sum + (Number(t.amount) > 0 ? Math.abs(Number(t.amount)) : -Math.abs(Number(t.amount))),
      0
    );
    const avgDailyBurn = net30 / 30;
    const monthlyBurn = avgDailyBurn * 30;

    // Runway = total balance / monthly burn (if burn positive)
    const runwayMonths = monthlyBurn > 0 ? totalBalance / monthlyBurn : null;

    // Cash flow monthly grouping for last 6 months
    const monthly: Record<string, { income: number; expense: number }> = {};
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = d.toLocaleString("en-US", { month: "short" });
      monthly[key] = { income: 0, expense: 0 };
    }

    for (const t of transactions) {
      const key = new Date(t.date).toLocaleString("en-US", { month: "short" });
      if (!monthly[key]) continue;
      const abs = Math.abs(Number(t.amount || 0));
      if (Number(t.amount) < 0) monthly[key].income += abs;
      else monthly[key].expense += abs;
    }

    // Month-over-month change
    const now = new Date();
    const thisMonthKey = now.toLocaleString("en-US", { month: "short" });
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthKey = lastMonth.toLocaleString("en-US", { month: "short" });
    const thisMonthIncome = monthly[thisMonthKey]?.income || 0;
    const lastMonthIncome = monthly[lastMonthKey]?.income || 0;
    const incomeChange = thisMonthIncome - lastMonthIncome;
    const incomeChangePercent = lastMonthIncome > 0 ? (incomeChange / lastMonthIncome) * 100 : 0;

    const thisMonthExpense = monthly[thisMonthKey]?.expense || 0;
    const lastMonthExpense = monthly[lastMonthKey]?.expense || 0;
    const expenseChange = thisMonthExpense - lastMonthExpense;
    const expenseChangePercent = lastMonthExpense > 0 ? (expenseChange / lastMonthExpense) * 100 : 0;

    // Balance change (last 30 days vs previous 30)
    const current30 = transactions.filter((t) => new Date(t.date) >= new Date(Date.now() - 30 * 86400000));
    const previous30 = transactions.filter(
      (t) => new Date(t.date) >= new Date(Date.now() - 60 * 86400000) && new Date(t.date) < new Date(Date.now() - 30 * 86400000)
    );
    const currentNet = current30.reduce((s, t) => s + (Number(t.amount) > 0 ? -Math.abs(Number(t.amount)) : Math.abs(Number(t.amount))), 0);
    const previousNet = previous30.reduce((s, t) => s + (Number(t.amount) > 0 ? -Math.abs(Number(t.amount)) : Math.abs(Number(t.amount))), 0);
    const balanceChangePercent = previousNet !== 0 ? ((currentNet - previousNet) / Math.abs(previousNet)) * 100 : 0;

    const todayStart = new Date().toISOString().split("T")[0];
    const todayReceived = transactions
      .filter((t) => Number(t.amount) < 0 && t.date === todayStart)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);

    return NextResponse.json({
      total_balance: Number(totalBalance.toFixed(2)),
      income_90d: Number(income.toFixed(2)),
      expense_90d: Number(expense.toFixed(2)),
      monthly_burn: Number(monthlyBurn.toFixed(2)),
      runway_months: runwayMonths ? Number(runwayMonths.toFixed(1)) : null,
      cash_flow: Object.entries(monthly).map(([name, vals]) => ({ name, income: vals.income, expense: vals.expense })),
      account_count: accounts?.length || 0,
      transaction_count_90d: transactions.length,
      today_received: Number(todayReceived.toFixed(2)),
      unpaid_invoices: 0,
      credit_card_expense_90d: Number(creditCardExpense.toFixed(2)),
      checking_expense_90d: Number(checkingExpense.toFixed(2)),
      income_change: Number(incomeChange.toFixed(2)),
      income_change_percent: Number(incomeChangePercent.toFixed(1)),
      expense_change: Number(expenseChange.toFixed(2)),
      expense_change_percent: Number(expenseChangePercent.toFixed(1)),
      balance_change_percent: Number(balanceChangePercent.toFixed(1)),
    });
  } catch (err: any) {
    console.error("Reporting error:", err);
    return NextResponse.json({ error: err.message || "Reporting failed" }, { status: 500 });
  }
}
