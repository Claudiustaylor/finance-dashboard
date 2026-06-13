import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { createClient } from '@supabase/supabase-js';

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'production'],
  baseOptions: { headers: { 'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID, 'PLAID-SECRET': process.env.PLAID_SECRET } }
});
const plaid = new PlaidApi(config);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function sync() {
  // 1. Get item with access_token
  const { data: item, error: itemErr } = await supabase.from('plaid_items').select('*,plaid_access_token,plaid_item_id').single();
  if (itemErr || !item) { console.log('Item error:', itemErr?.message); return; }
  
  console.log(`Syncing: ${item.institution_name} | ${item.user_id}`);
  
  // 2. Sync accounts + balances
  const bal = await plaid.accountsBalanceGet({ access_token: item.plaid_access_token });
  console.log(`Plaid accounts: ${bal.data.accounts.length}`);
  
  for (const acct of bal.data.accounts) {
    const { error } = await supabase.from('accounts').upsert({
      id: acct.account_id, // Plaid IDs are non-UUID — let me check if this works
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
    if (error) console.log('  Account upsert error:', error.message);
    else console.log(`  $${acct.balances.current} — ${acct.name}`);
  }
  
  // 3. Build account ID mapping
  const { data: dbAccts } = await supabase.from('accounts').select('id, plaid_account_id');
  const acctMap = {};
  dbAccts?.forEach(a => acctMap[a.plaid_account_id] = a.id);
  
  // 4. Fetch transactions
  const end = new Date().toISOString().split('T')[0];
  const start = new Date(Date.now() - 90*24*60*60*1000).toISOString().split('T')[0];
  const txResp = await plaid.transactionsGet({
    access_token: item.plaid_access_token,
    start_date: start,
    end_date: end,
    options: { count: 100, offset: 0 }
  });
  
  const txs = txResp.data.transactions || [];
  console.log(`\nTransactions: ${txs.length} (total: ${txResp.data.total_transactions})`);
  
  for (const t of txs) {
    const acctUUID = acctMap[t.account_id];
    if (!acctUUID) { console.log(`  SKIP: unknown account ${t.account_id}`); continue; }
    
    const { error } = await supabase.from('transactions').upsert({
      id: crypto.randomUUID(),
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
      plaid_category_id: t.category_id ? [t.category_id] : null
    }, { onConflict: 'plaid_transaction_id' });
    
    if (error) console.log(`  TX error: ${error.message}`);
    else console.log(`  ${t.date} | $${t.amount} | ${t.name}`);
  }
  
  // 5. Update sync time
  await supabase.from('plaid_items').update({ last_synced_at: new Date().toISOString() }).eq('id', item.id);
  
  // 6. Verify
  const { count } = await supabase.from('transactions').select('*',{count:'exact',head:true});
  const { data: finalAccts } = await supabase.from('accounts').select('*');
  console.log(`\n=== SYNC COMPLETE ===`);
  console.log(`Accounts: ${finalAccts?.length}, Transactions: ${count}`);
  finalAccts?.forEach(a => console.log(`  $${a.current_balance} — ${a.name}`));
}

sync().catch(e => console.error(e.response?.data || e.message));
