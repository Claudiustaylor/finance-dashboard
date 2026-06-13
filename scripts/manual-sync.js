const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const PLAID_ENV = process.env.PLAID_ENV || 'sandbox';
const PLAID_BASE_URL = PLAID_ENV === 'production'
  ? 'https://production.plaid.com'
  : PLAID_ENV === 'development'
  ? 'https://development.plaid.com'
  : 'https://sandbox.plaid.com';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function syncTransactions() {
  const { data: items, error: iErr } = await supabase
    .from('plaid_items')
    .select('id, user_id, plaid_access_token, transactions_cursor')
    .eq('status', 'active');
  if (iErr) { console.error('items error', iErr); return; }
  if (!items || items.length === 0) { console.log('No plaid items'); return; }

  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, user_id, plaid_account_id');

  const accountMap = new Map();
  for (const a of accounts || []) {
    if (a.plaid_account_id) accountMap.set(a.plaid_account_id, a.id);
  }

  let added = 0, modified = 0, removed = 0;

  for (const item of items) {
    let cursor = item.transactions_cursor || undefined;
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(`${PLAID_BASE_URL}/transactions/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: PLAID_CLIENT_ID,
          secret: PLAID_SECRET,
          access_token: item.plaid_access_token,
          cursor,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error('Plaid error for item', item.id, err);
        break;
      }

      const data = await res.json();

      if (data.added && data.added.length > 0) {
        const rows = data.added
          .map(txn => {
            const accountId = accountMap.get(txn.account_id);
            if (!accountId) return null;
            const pfc = txn.personal_finance_category || {};
            return {
              user_id: item.user_id,
              account_id: accountId,
              plaid_transaction_id: txn.transaction_id,
              plaid_category_id: pfc.primary ? [pfc.primary, pfc.detailed] : (txn.category_id ? [String(txn.category_id)] : []),
              plaid_category: pfc.primary ? [pfc.primary, pfc.detailed] : (txn.category || []),
              amount: txn.amount,
              currency_code: txn.iso_currency_code || 'USD',
              name: txn.name,
              merchant_name: txn.merchant_name || null,
              description: txn.website || txn.payment_channel || null,
              date: txn.date,
              authorized_date: txn.authorized_date || null,
              pending: txn.pending || false,
              location: txn.location || null,
              payment_meta: txn.payment_meta || null,
              plaid_raw_data: txn,
            };
          })
          .filter(Boolean);

        if (rows.length > 0) {
          const { error: insErr } = await supabase
            .from('transactions')
            .upsert(rows, { onConflict: 'user_id,plaid_transaction_id', ignoreDuplicates: false });
          if (insErr) console.error('upsert error', insErr);
          else added += rows.length;
        }
      }

      if (data.modified && data.modified.length > 0) {
        const rows = data.modified
          .map(txn => {
            const accountId = accountMap.get(txn.account_id);
            if (!accountId) return null;
            const pfc = txn.personal_finance_category || {};
            return {
              user_id: item.user_id,
              account_id: accountId,
              plaid_transaction_id: txn.transaction_id,
              plaid_category_id: pfc.primary ? [pfc.primary, pfc.detailed] : (txn.category_id ? [String(txn.category_id)] : []),
              plaid_category: pfc.primary ? [pfc.primary, pfc.detailed] : (txn.category || []),
              amount: txn.amount,
              currency_code: txn.iso_currency_code || 'USD',
              name: txn.name,
              merchant_name: txn.merchant_name || null,
              description: txn.website || txn.payment_channel || null,
              date: txn.date,
              authorized_date: txn.authorized_date || null,
              pending: txn.pending || false,
              location: txn.location || null,
              payment_meta: txn.payment_meta || null,
              plaid_raw_data: txn,
            };
          })
          .filter(Boolean);
        if (rows.length > 0) {
          const { error: modErr } = await supabase
            .from('transactions')
            .upsert(rows, { onConflict: 'user_id,plaid_transaction_id', ignoreDuplicates: false });
          if (!modErr) modified += rows.length;
        }
      }

      if (data.removed && data.removed.length > 0) {
        const ids = data.removed.map(t => t.transaction_id);
        const { error: delErr } = await supabase
          .from('transactions')
          .delete()
          .eq('user_id', item.user_id)
          .in('plaid_transaction_id', ids);
        if (!delErr) removed += ids.length;
      }

      cursor = data.next_cursor;
      hasMore = data.has_more === true;

      const { error: updErr } = await supabase
        .from('plaid_items')
        .update({ transactions_cursor: cursor, last_synced_at: new Date().toISOString() })
        .eq('id', item.id);
      if (updErr) console.error('cursor update error', updErr);
    }
  }

  console.log(`Sync complete: added=${added}, modified=${modified}, removed=${removed}`);
}

syncTransactions().catch(e => { console.error(e); process.exit(1); });
