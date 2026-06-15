import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeUserId } from "@/lib/user-id";

function getUserId(req: NextRequest): string | null {
  return normalizeUserId(req.headers.get("x-titan-user-id") || req.headers.get("x-user-id"));
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const sb = supabaseAdmin();

    // Verify ownership
    const { data: existing } = await sb
      .from("plaid_items")
      .select("id")
      .eq("id", itemId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    // Delete dependent accounts first, then the item
    await sb.from("accounts").delete().eq("plaid_item_id", itemId);
    const { error } = await sb.from("plaid_items").delete().eq("id", itemId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Disconnect failed" }, { status: 500 });
  }
}
