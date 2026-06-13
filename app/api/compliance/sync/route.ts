import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://uyvkqgmuxerjdqarjgbh.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/* ─── POST /api/compliance/sync ───
   Upserts entities + filings into Supabase, returns merged server state  */
export async function POST(req: NextRequest) {
  try {
    const { entities, completions } = await req.json();
    if (!Array.isArray(entities)) {
      return NextResponse.json({ error: "entities required" }, { status: 400 });
    }

    const userId = "titan_default_user"; // Replace with auth.user_id when auth is wired

    // Upsert entities
    const dbEntities = entities.map((e: any) => ({
      id: e.id,
      user_id: userId,
      name: e.name,
      type: e.type,
      state: e.state,
      formation_date: e.formationDate,
      ein: e.ein,
      notes: e.notes,
      updated_at: new Date().toISOString(),
    }));

    const { error: eErr } = await supabase
      .from("compliance_entities")
      .upsert(dbEntities, { onConflict: "id" });
    if (eErr) throw eErr;

    // Upsert completions as filings
    if (completions && Object.keys(completions).length) {
      const now = new Date().toISOString();
      const dbFilings = Object.entries(completions as Record<string, boolean>)
        .filter(([, v]) => v)
        .map(([filingId]) => ({
          id: filingId,
          completed: true,
          completed_at: now,
          updated_at: now,
        }));
      if (dbFilings.length) {
        const { error: fErr } = await supabase
          .from("compliance_filings")
          .upsert(dbFilings, { onConflict: "id" });
        if (fErr) throw fErr;
      }
    }

    // Fetch latest server state
    const { data: serverEntities } = await supabase
      .from("compliance_entities")
      .select("*")
      .eq("user_id", userId);

    const { data: serverFilings } = await supabase
      .from("compliance_filings")
      .select("id, completed, completed_at")
      .in(
        "entity_id",
        (serverEntities || []).map((e: any) => e.id)
      );

    const serverCompletions: Record<string, boolean> = {};
    for (const f of serverFilings || []) {
      serverCompletions[f.id] = f.completed;
    }

    return NextResponse.json({
      ok: true,
      entities: (serverEntities || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        type: e.type,
        state: e.state,
        formationDate: e.formation_date,
        ein: e.ein,
        notes: e.notes,
      })),
      completions: serverCompletions,
    });
  } catch (err: any) {
    console.error("Compliance sync error:", err.message);
    return NextResponse.json({ error: err.message || "Sync failed" }, { status: 500 });
  }
}
