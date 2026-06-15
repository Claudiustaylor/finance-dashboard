import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const isActive = typeof body.is_active === "boolean" ? body.is_active : null;

    if (isActive === null) {
      return NextResponse.json({ error: "is_active boolean is required" }, { status: 400 });
    }

    const sb = supabaseAdmin();
    const { data: account, error } = await sb
      .from("accounts")
      .update({ is_active: isActive })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("PATCH account error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, account });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Update failed";
    console.error("PATCH /api/accounts/:id error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
