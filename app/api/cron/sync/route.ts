import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import crypto from "crypto";
import { getPlaidEnv } from "@/lib/plaid-env";
import { normalizeUserId } from '@/lib/user-id';

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

/** GET /api/cron/sync
 * Triggered by Vercel Cron. Authenticates via Authorization: Bearer CRON_SECRET
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.replace("Bearer ", "").trim();
  if (bearer !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const env = getPlaidEnv();
  const plaid = createPlaid(env);

  const { data: items, error: itemsErr } = await supabase
    .from("plaid_items")
    .select("*,plaid_access_token,plaid_item_id,user_id,id")
    .eq("status", "active");

  if (itemsErr) {
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ ok: true, message: "No active plaid items", synced: 0 });
  }

  const results: { item: string; accounts: number; transactions: number }[] = [];

  for (const item of items) {
    try {
      // Balances
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

      // Transactions (last 90 days)
      const end = new Date().toISOString().split("T")[0];
      const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const txResp = await plaid.transactionsGet({
        access_token: item.plaid_access_token,
        start_date: start, end_date: end,
        options: { count: 500, offset: 0 },
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

      results.push({ item: item.institution_name || item.plaid_item_id, accounts: bal.data.accounts.length, transactions: txs.length });
    } catch (err: any) {
      console.error(`Cron sync error for item ${item.id}:`, err.response?.data || err.message);
      results.push({ item: item.institution_name || item.plaid_item_id, accounts: 0, transactions: 0 });
    }
  }

  return NextResponse.json({ ok: true, synced: items.length, results });
}
