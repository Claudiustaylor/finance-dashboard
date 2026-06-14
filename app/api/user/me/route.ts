import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeUserId } from "@/lib/user-id";

function getUserId(req: NextRequest): string | null {
  return normalizeUserId(req.headers.get("x-titan-user-id") || req.headers.get("x-user-id"));
}

export async function GET(req: NextRequest) {
  try {
    const sb = supabaseAdmin();
    const headerUserId = getUserId(req);

    if (headerUserId) {
      // Validate the user has data; otherwise fall through to auto-detect
      const { data: acct } = await sb
        .from("accounts")
        .select("user_id")
        .eq("user_id", headerUserId)
        .limit(1)
        .single();
      if (acct) {
        return NextResponse.json({ user_id: headerUserId, source: "header" });
      }
    }

    // Auto-detect the most recently active connected account
    const { data: accts } = await sb
      .from("accounts")
      .select("user_id, updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1);

    const detected = accts?.[0]?.user_id;
    if (detected) {
      return NextResponse.json({ user_id: detected, source: "detected" });
    }

    // Fallback to the header even if no data yet, so a new user can onboard
    return NextResponse.json({ user_id: headerUserId || null, source: "none" });
  } catch (err: any) {
    console.error("/api/user/me error:", err);
    return NextResponse.json({ error: err.message || "Failed to resolve user" }, { status: 500 });
  }
}
