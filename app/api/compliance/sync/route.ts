import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://uyvkqgmuxerjdqarjgbh.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function POST(req: NextRequest) {
  try {
    const { entities, completions } = await req.json();
    if (!Array.isArray(entities)) {
      return NextResponse.json({ error: "entities required" }, { status: 400 });
    }

    const userId = "titan_default_user";
    const now = new Date().toISOString();

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
      updated_at: now,
    }));

    const { error: eErr } = await supabase
      .from("compliance_entities")
      .upsert(dbEntities, { onConflict: "id" });
    if (eErr) throw eErr;

    // Upsert filings with default values and proper entity_id
    const filingRows = [];
    for (const e of entities) {
      // Generate same filings as client to get stable IDs
      // Suffixes: annual, franchise, agent
      const suffixes = ["annual", "franchise", "agent"];
      // Use simple known set. If type/state rules change, this is best effort.
      // Filing types per suffix:
      const types = { annual: "Annual Report", franchise: "Franchise Tax", agent: "Registered Agent Verification" };
      for (const suffix of suffixes) {
        const filingId = `${e.id}-${suffix}`;
        const completed = completions?.[filingId] || false;
        filingRows.push({
          id: filingId,
          entity_id: e.id,
          filing_type: types[suffix as keyof typeof types],
          completed,
          completed_at: completed ? now : null,
          cost: "$0",
          late_fee: "$0",
        });
      }
    }

    if (filingRows.length) {
      const { error: fErr } = await supabase
        .from("compliance_filings")
        .upsert(filingRows, { onConflict: "id" });
      if (fErr) throw fErr;
    }

    // Fetch latest server state
    const { data: serverEntities } = await supabase
      .from("compliance_entities")
      .select("*")
      .eq("user_id", userId);

    const { data: serverFilings } = await supabase
      .from("compliance_filings")
      .select("id, completed, completed_at, entity_id")
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
