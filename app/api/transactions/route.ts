import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeUserId } from "@/lib/user-id";

function getUserId(req: NextRequest): string | null {
  return normalizeUserId(req.headers.get("x-titan-user-id") || req.headers.get("x-user-id"));
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || "20"), 100);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    const sb = supabaseAdmin();

    let q = sb
      .from("transactions")
      .select("id, name, merchant_name, amount, date, category_id, plaid_category, ai_category, is_recurring, pending, account_id, accounts:account_id(name, type, subtype)")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(limit);

    if (startDate) q = q.gte("date", startDate);
    if (endDate) q = q.lte("date", endDate);

    const { data, error } = await q;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transactions: data || [] });
  } catch (err: any) {
    console.error("/api/transactions error:", err);
    return NextResponse.json({ error: err.message || "Transactions query failed" }, { status: 500 });
  }
}
