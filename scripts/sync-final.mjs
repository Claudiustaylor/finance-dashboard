import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'production'],
  baseOptions: { headers: { 'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID, 'PLAID-SECRET': process.env.PLAID_SECRET } }
});
const plaid = new PlaidApi(plaidConfig);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function uuidFromString(str) {
  // Deterministic UUID v5-ish using MD5 hash (simplified)
  const hash = crypto.createHash('md5').update(str).digest('hex');
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-5${hash.slice(13,16)}-a${hash.slice(17,20)}-${hash.slice(20,32)}`;
}

async function sync() {
  const { data: item, error: itemErr } = await supabase.from('plaid_items').select('*').single();
  if (itemErr || !item) { console.log('No plaid item:', itemErr?.message); return; }
  
  console.log(`=== SYNCING: ${item.institution_name} ===\n`);
  
  // 1. Sync accounts + balances
  const bal = await plaid.accountsBalanceGet({ access_token: item.plaid_access_token });
  for (const acct of bal.data.accounts) {
    const acctUUID = uuidFromString(acct.account_id);
    const { error } = await supabase.from('accounts').upsert({
      id: acctUUID,
      user_id: item.user_id,
      plaid_item_id: item.id,
      plaid_account_id: acct.account_id,
      name: acct.name,
      official_name: acct.official_name,
      type: acct.type,
      subtype: acct.subtype,
      mask: acct.mask,
      current_balance: acct.balances.current,
      available_balance: acct.balances.available,
      currency_code: acct.balances.iso_currency_code || 'USD'
    }, { onConflict: 'id' });
    if (error) console.log(`Account error: ${error.message}`);
    else console.log(`$${acct.balances.current} — ${acct.name} (${acct.mask})`);
  }
  
  // 2. Build account map
  const { data: dbAccts } = await supabase.from('accounts').select('id, plaid_account_id');
  const acctMap = {};
  dbAccts?.forEach(a => acctMap[a.plaid_account_id] = a.id);
  
  // 3. Fetch transactions
  const end = new Date().toISOString().split('T')[0];
  const start = new Date(Date.now() - 90*24*60*60*1000).toISOString().split('T')[0];
  const txResp = await plaid.transactionsGet({
    access_token: item.plaid_access_token,
    start_date: start,
    end_date: end,
    options: { count: 100, offset: 0 }
  });
  const txs = txResp.data.transactions || [];
  console.log(`\nTransactions: ${txs.length}\n`);
  
  for (const t of txs) {
    const acctUUID = acctMap[t.account_id];
    if (!acctUUID) { console.log(`SKIP: unknown account ${t.account_id}`); continue; }
    
    const txUUID = uuidFromString(t.transaction_id);
    const { error } = await supabase.from('transactions').upsert({
      id: txUUID,
      plaid_transaction_id: t.transaction_id,
      user_id: item.user_id,
      account_id: acctUUID,
      amount: t.amount,
      currency_code: t.iso_currency_code || 'USD',
      name: t.name,
      merchant_name: t.merchant_name || t.name,
      date: t.date,
      pending: t.pending || false,
      plaid_category: t.category,
      plaid_category_id: t.category_id ? [String(t.category_id)] : null
    }, { onConflict: 'id' });
    
    if (error) console.log(`  ERROR: ${error.message}`);
    else console.log(`  ${t.date} | $${t.amount} | ${t.name}`);
  }
  
  // 4. Update sync time
  await supabase.from('plaid_items').update({ last_synced_at: new Date().toISOString() }).eq('id', item.id);
  
  // 5. Verify
  const { count } = await supabase.from('transactions').select('*',{count:'exact',head:true});
  const { data: finalAccts } = await supabase.from('accounts').select('*');
  console.log(`\n=== DONE === Accounts: ${finalAccts?.length}, Transactions: ${count}`);
}

sync().catch(e => console.error(e.response?.data || e.message));
