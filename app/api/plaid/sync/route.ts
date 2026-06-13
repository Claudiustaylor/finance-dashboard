import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import crypto from "crypto";
import { getPlaidEnv } from "@/lib/plaid-env";

function createPlaid(env: "production" | "development" | "sandbox") {
  return new PlaidApi(
    new Configuration({
      basePath: PlaidEnvironments[env],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID || "",
          "PLAID-SECRET": process.env.PLAID_SECRET || "",
        },
      },
    })
  );
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function uuidFromString(str: string) {
  const hash = crypto.createHash("md5").update(str).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

export async function POST(req: NextRequest) {
  try {
    const env = getPlaidEnv(req);
    const plaid = createPlaid(env);

    const { data: item } = await supabase.from("plaid_items").select("*,plaid_access_token,plaid_item_id,user_id").single();
    if (!item) {
      return NextResponse.json({ error: "No bank connected" }, { status: 400 });
    }

    // Sync balances
    const bal = await plaid.accountsBalanceGet({ access_token: item.plaid_access_token });
    for (const acct of bal.data.accounts) {
      const acctUUID = uuidFromString(acct.account_id);
      await supabase.from("accounts").upsert(
        {
          id: acctUUID, user_id: item.user_id, plaid_item_id: item.id,
          plaid_account_id: acct.account_id, name: acct.name,
          official_name: acct.official_name, type: acct.type,
          subtype: acct.subtype, mask: acct.mask,
          current_balance: acct.balances.current,
          available_balance: acct.balances.available,
          currency_code: acct.balances.iso_currency_code || "USD",
        },
        { onConflict: "id" }
      );
    }

    // Account map
    const { data: dbAccts } = await supabase.from("accounts").select("id, plaid_account_id");
    const acctMap: Record<string, string> = {};
    dbAccts?.forEach((a: any) => (acctMap[a.plaid_account_id] = a.id));

    // Fetch transactions
    const end = new Date().toISOString().split("T")[0];
    const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const txResp = await plaid.transactionsGet({
      access_token: item.plaid_access_token,
      start_date: start, end_date: end,
      options: { count: 100, offset: 0 },
    });

    const txs = txResp.data.transactions || [];
    for (const t of txs) {
      const acctUUID = acctMap[t.account_id];
      if (!acctUUID) continue;
      const txUUID = uuidFromString(t.transaction_id);
      await supabase.from("transactions").upsert(
        {
          id: txUUID, plaid_transaction_id: t.transaction_id,
          user_id: item.user_id, account_id: acctUUID,
          amount: t.amount, currency_code: t.iso_currency_code || "USD",
          name: t.name, merchant_name: t.merchant_name || t.name,
          date: t.date, pending: t.pending || false,
          plaid_category: t.category,
          plaid_category_id: t.category_id ? [String(t.category_id)] : null,
        },
        { onConflict: "id" }
      );
    }

    await supabase.from("plaid_items").update({ last_synced_at: new Date().toISOString() }).eq("id", item.id);

    const { count } = await supabase.from("transactions").select("*", { count: "exact", head: true });
    return NextResponse.json({
      ok: true, accounts: bal.data.accounts.length,
      transactions: txs.length, totalTransactions: count,
    });
  } catch (err: any) {
    console.error("Sync error:", err.response?.data || err.message);
    return NextResponse.json(
      { error: err.response?.data?.error_message || err.message || "Sync failed" },
      { status: 500 }
    );
  }
}
