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

    const sb = supabaseAdmin();
    const { data: items, error } = await sb
      .from("plaid_items")
      .select("id, institution_name, plaid_institution_id, status, created_at, last_synced_at, error_code, error_message")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: items || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load connections" }, { status: 500 });
  }
}
