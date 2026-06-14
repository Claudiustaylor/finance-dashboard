import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { normalizeUserId } from '@/lib/user-id';

function getUserId(req: NextRequest): string | null {
  return normalizeUserId(req.headers.get("x-titan-user-id") || req.headers.get("x-user-id"));
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId(req);
    if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 401 });

    const sb = supabaseAdmin();
    const body = await req.json();
    const { transaction_id, total_amount, start_date, end_date, method = "straight_line" } = body;

    if (!transaction_id || !total_amount || !start_date || !end_date) {
      return NextResponse.json(
        { error: "transaction_id, total_amount, start_date, end_date required" },
        { status: 400 }
      );
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth());
    const monthly = Number(total_amount) / months;

    const entries = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(start);
      d.setMonth(start.getMonth() + i + 1);
      entries.push({ month_end: d.toISOString().split("T")[0], amount: Number(monthly.toFixed(2)) });
    }

    const { data, error } = await sb
      .from("revenue_recognition_schedules")
      .upsert(
        {
          user_id: userId,
          transaction_id,
          total_amount,
          start_date,
          end_date,
          method,
          schedule_entries: entries,
          recognized_to_date: 0,
        },
        { onConflict: "transaction_id" }
      )
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      schedule_id: data?.id,
      months,
      monthly,
      entries,
    });
  } catch (err: any) {
    console.error("Revenue recognition error:", err);
    return NextResponse.json({ error: err.message || "Revenue recognition failed" }, { status: 500 });
  }
}
