import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeUserId } from "@/lib/user-id";

export async function GET(req: NextRequest) {
  const userId = normalizeUserId(req.headers.get("x-titan-user-id") || req.headers.get("x-user-id"));
  if (!userId) {
    return NextResponse.json({ error: "Missing user id" }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const [{ data: accts }, { data: items }] = await Promise.all([
    sb.from("accounts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    sb.from("plaid_items").select("*").eq("user_id", userId).neq("status", "disconnected").order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({ accounts: accts || [], plaidItems: items || [] });
}
