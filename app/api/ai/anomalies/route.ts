import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeUserId } from '@/lib/user-id';

function getUserId(req: NextRequest): string | null {
  return normalizeUserId(req.headers.get("x-titan-user-id") || req.headers.get("x-user-id"));
}

function detectAnomalies(transactions: any[]) {
  const reasons: Record<string, string[]> = {};
  const seen = new Map<string, number>();
  const amounts: number[] = transactions.map((t) => Number(t.amount || 0));
  const avg = amounts.reduce((a, b) => a + b, 0) / (amounts.length || 1);
  const std = Math.sqrt(
    amounts.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / (amounts.length || 1)
  ) || 0;

  for (const t of transactions) {
    const list: string[] = [];
    const key = `${t.merchant_name || t.name}|${t.amount}|${t.date}`;
    seen.set(key, (seen.get(key) || 0) + 1);
    if (seen.get(key)! > 1) list.push("Possible duplicate transaction");
    const amount = Number(t.amount || 0);
    if (avg > 0 && amount > avg + 3 * std && std > 0) list.push("Unusually large amount spike");
    if (amount > avg * 5 && avg > 0) list.push("Amount is 5x the average");
    if (t.pending) list.push("Transaction still pending");
    reasons[t.id] = list;
  }

  return transactions
    .map((t) => ({ ...t, reasons: reasons[t.id] || [] }))
    .filter((t) => t.reasons.length > 0);
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 401 });

    const body = await req.json();
    const days = Number(body.days) || 90;

    const cutoff = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
    const { data, error } = await supabaseAdmin()
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("date", cutoff)
      .order("amount", { ascending: false })
      .limit(500);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const flagged = detectAnomalies(data || []);

    return NextResponse.json({
      scanned: (data || []).length,
      flagged_count: flagged.length,
      anomalies: flagged.slice(0, 25),
    });
  } catch (err: any) {
    console.error("Anomalies error:", err);
    return NextResponse.json({ error: err.message || "Anomaly detection failed" }, { status: 500 });
  }
}
