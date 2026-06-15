import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getPlaidEnv, plaidBaseUrl } from "@/lib/plaid-env";
import { normalizeUserId } from "@/lib/user-id";

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || "";
const PLAID_SECRET = process.env.PLAID_SECRET || "";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemId, userId: rawUserId } = body;
    const userId = normalizeUserId(rawUserId);

    if (!itemId || !userId) {
      return NextResponse.json({ error: "itemId and userId are required" }, { status: 400 });
    }

    const sb = supabaseAdmin();
    const { data: item, error: findError } = await sb
      .from("plaid_items")
      .select("id, plaid_access_token, plaid_item_id, plaid_institution_id, institution_name")
      .eq("id", itemId)
      .eq("user_id", userId)
      .maybeSingle();

    if (findError || !item) {
      return NextResponse.json(
        { error: findError?.message || "Connection not found" },
        { status: findError ? 500 : 404 }
      );
    }

    const env = getPlaidEnv(req);
    const baseUrl = plaidBaseUrl(env);

    // 1. Create a link_token in update mode
    const tokenRes = await fetch(`${baseUrl}/link/token/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        user: { client_user_id: userId },
        client_name: "Titan Finance",
        access_token: item.plaid_access_token,
        products: ["transactions", "auth", "liabilities"],
        country_codes: ["US"],
        language: "en",
        transactions: { days_requested: 730 },
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Plaid repair link token error:", JSON.stringify(tokenData));
      return NextResponse.json(
        { error: tokenData.error_message || "Failed to create repair token", plaid_error_code: tokenData.error_code },
        { status: tokenRes.status }
      );
    }

    return NextResponse.json({
      link_token: tokenData.link_token,
      item_id: item.id,
      institution_name: item.institution_name,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Repair failed" }, { status: 500 });
  }
}
