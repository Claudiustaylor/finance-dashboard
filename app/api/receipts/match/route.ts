import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeUserId } from '@/lib/user-id';

function getUserId(req: NextRequest): string | null {
  return normalizeUserId(req.headers.get("x-titan-user-id") || req.headers.get("x-user-id"));
}

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] =
        b[i - 1] === a[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(a.toLowerCase(), b.toLowerCase());
  return 1 - dist / maxLen;
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    const body = await req.json();
    const { amount, merchant, date, receipt_id } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });
    }
    if (amount == null || !date) {
      return NextResponse.json({ error: "amount and date are required" }, { status: 400 });
    }

    const sb = supabaseAdmin();
    const targetDate = new Date(date);
    const windowStart = new Date(targetDate);
    windowStart.setDate(targetDate.getDate() - 3);
    const windowEnd = new Date(targetDate);
    windowEnd.setDate(targetDate.getDate() + 3);

    const { data: txs } = await sb
      .from("transactions")
      .select("id, name, merchant_name, amount, date")
      .eq("user_id", userId)
      .gte("date", windowStart.toISOString().split("T")[0])
      .lte("date", windowEnd.toISOString().split("T")[0])
      .order("date", { ascending: false });

    let best: any = null;
    let bestScore = 0;

    for (const tx of txs || []) {
      const txAmount = Number(tx.amount || 0);
      const amountDiff = Math.abs(txAmount - amount);
      const amountScore = amountDiff < 0.01 ? 1 : Math.max(0, 1 - amountDiff / Math.max(Math.abs(txAmount), Math.abs(amount), 1));

      const merchantName = tx.merchant_name || tx.name || "";
      const nameScore = merchant ? similarity(merchantName, merchant) : 0;
      const score = amountScore * 0.6 + nameScore * 0.4;

      if (score > bestScore) {
        bestScore = score;
        best = tx;
      }
    }

    if (best && bestScore > 0.5) {
      if (receipt_id) {
        await sb.from("receipts").update({ transaction_id: best.id, status: "processed" }).eq("id", receipt_id).eq("user_id", userId);
      }
      return NextResponse.json({
        match: {
          transaction_id: best.id,
          name: best.name || best.merchant_name,
          amount: Number(best.amount || 0),
          date: best.date,
          score: Number(bestScore.toFixed(2)),
        },
      });
    }

    return NextResponse.json({ match: null, candidates: (txs || []).slice(0, 5) });
  } catch (err: any) {
    console.error("Receipt match error:", err);
    return NextResponse.json({ error: err.message || "Match failed" }, { status: 500 });
  }
}
