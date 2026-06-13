import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function getUserId(req: NextRequest): string | null {
  return req.headers.get("x-titan-user-id") || req.headers.get("x-user-id") || null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 401 });

    const body = await req.json();
    const { transaction_ids = [], approved = [] } = body;

    const sb = supabaseAdmin();

    // Run reconciliation: clear non-pending, flag discrepancies
    const { data: txs } = await sb
      .from("transactions")
      .select("id, account_id, amount, date, name, pending")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(500);

    const updates: any[] = [];
    for (const t of txs || []) {
      const isApproved = approved.includes(t.id);
      const status = t.pending ? "pending" : isApproved ? "cleared" : "matched";
      updates.push({
        user_id: userId,
        transaction_id: t.id,
        status,
        discrepancy_amount: 0,
        reconciled_at: isApproved ? new Date().toISOString() : null,
      });
    }

    for (const up of updates) {
      await sb.from("reconciliation_status").upsert(up, { onConflict: "transaction_id" });
    }

    return NextResponse.json({
      reconciled: updates.filter((u) => u.status === "cleared").length,
      flagged: updates.filter((u) => u.status === "matched").length,
      pending: updates.filter((u) => u.status === "pending").length,
    });
  } catch (err: any) {
    console.error("Reconcile error:", err);
    return NextResponse.json({ error: err.message || "Reconciliation failed" }, { status: 500 });
  }
}
