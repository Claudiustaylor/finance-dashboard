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
    const { data: accounts } = await sb.from("accounts").select("id, current_balance, type").eq("user_id", userId).eq("is_active", true);
    const { data: txs } = await sb
      .from("transactions")
      .select("amount, date, category_id, type, pending")
      .eq("user_id", userId)
      .gte("date", new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0])
      .order("date", { ascending: true });

    const transactions = txs || [];
    const totalBalance = (accounts || []).reduce((sum, a) => sum + Number(a.current_balance || 0), 0);

    const income = transactions
      .filter((t) => Number(t.amount) < 0 || t.type === "credit")
      .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);
    const expense = transactions
      .filter((t) => Number(t.amount) > 0 || t.type === "debit")
      .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);

    // Burn rate = last 30 days net outflow averaged daily, multiplied to monthly
    const last30 = transactions.filter((t) => new Date(t.date) >= new Date(Date.now() - 30 * 86400000));
    const net30 = last30.reduce(
      (sum, t) => sum + (Number(t.amount) > 0 || t.type === "debit" ? Math.abs(Number(t.amount)) : -Math.abs(Number(t.amount))),
      0
    );
    const avgDailyBurn = net30 / 30;
    const monthlyBurn = avgDailyBurn * 30;

    // Runway = total balance / monthly burn (if burn positive)
    const runwayMonths = monthlyBurn > 0 ? totalBalance / monthlyBurn : null;

    // Cash flow monthly grouping for last 6 months
    const monthly: Record<string, { income: number; expense: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("en-US", { month: "short" });
      monthly[key] = { income: 0, expense: 0 };
    }

    for (const t of transactions) {
      const key = new Date(t.date).toLocaleString("en-US", { month: "short" });
      if (!monthly[key]) continue;
      const abs = Math.abs(Number(t.amount || 0));
      if (Number(t.amount) < 0 || t.type === "credit") monthly[key].income += abs;
      else monthly[key].expense += abs;
    }

    return NextResponse.json({
      total_balance: Number(totalBalance.toFixed(2)),
      income_90d: Number(income.toFixed(2)),
      expense_90d: Number(expense.toFixed(2)),
      monthly_burn: Number(monthlyBurn.toFixed(2)),
      runway_months: runwayMonths ? Number(runwayMonths.toFixed(1)) : null,
      cash_flow: Object.entries(monthly).map(([name, vals]) => ({ name, income: vals.income, expense: vals.expense })),
      account_count: accounts?.length || 0,
      transaction_count_90d: transactions.length,
    });
  } catch (err: any) {
    console.error("Reporting error:", err);
    return NextResponse.json({ error: err.message || "Reporting failed" }, { status: 500 });
  }
}
