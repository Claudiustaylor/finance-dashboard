import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeUserId } from '@/lib/user-id';

function getUserId(req: NextRequest): string | null {
  return normalizeUserId(req.headers.get("x-titan-user-id") || req.headers.get("x-user-id"));
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 401 });

    const sb = supabaseAdmin();
    const { data } = await sb
      .from("recurring_rules")
      .select("*")
      .eq("user_id", userId)
      .order("next_expected_date", { ascending: true })
      .limit(50);

    return NextResponse.json({ rules: data || [] });
  } catch (err: any) {
    console.error("Recurring rules error:", err);
    return NextResponse.json({ error: err.message || "Failed to load recurring rules" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 401 });

    const sb = supabaseAdmin();
    const body = await req.json();
    const { name, amount, cadence, day_of_month, gl_account_id, next_expected_date } = body;

    if (!name || amount == null || !cadence || !next_expected_date) {
      return NextResponse.json(
        { error: "name, amount, cadence, next_expected_date required" },
        { status: 400 }
      );
    }

    const { data, error } = await sb
      .from("recurring_rules")
      .insert({
        user_id: userId,
        name,
        amount,
        cadence,
        day_of_month,
        gl_account_id,
        next_expected_date,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ rule_id: data?.id });
  } catch (err: any) {
    console.error("Recurring rule create error:", err);
    return NextResponse.json({ error: err.message || "Failed to create recurring rule" }, { status: 500 });
  }
}
