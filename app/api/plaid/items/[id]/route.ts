import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sb = supabaseAdmin();

    const { error: itemErr } = await sb
      .from("plaid_items")
      .update({ status: "disconnected" })
      .eq("id", id);

    if (itemErr) {
      console.error("Disconnect plaid item error:", itemErr);
      return NextResponse.json({ error: itemErr.message }, { status: 500 });
    }

    const { error: acctsErr } = await sb
      .from("accounts")
      .update({ is_active: false })
      .eq("plaid_item_id", id);

    if (acctsErr) {
      console.error("Deactivate accounts error:", acctsErr);
      return NextResponse.json({ error: acctsErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Disconnect failed";
    console.error("DELETE /api/plaid/items/:id error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
