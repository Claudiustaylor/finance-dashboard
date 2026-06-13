import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'production'],
  baseOptions: { headers: { 'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID, 'PLAID-SECRET': process.env.PLAID_SECRET } }
});
const plaid = new PlaidApi(config);

const supabase = (await import('@supabase/supabase-js')).createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function sync() {
  const { data: item } = await supabase.from('plaid_items').select('*').single();
  if (!item) { console.log('No plaid item found'); return; }
  
  console.log(`Syncing item ${item.id} for user ${item.user_id}`);
  
  const syncResp = await plaid.transactionsSync({ access_token: item.access_token, count: 100 });
  const added = syncResp.data.added || [];
  const modified = syncResp.data.modified || [];
  const removed = syncResp.data.removed || [];
  const cursor = syncResp.data.next_cursor;
  
  console.log(`Added: ${added.length}, Modified: ${modified.length}, Removed: ${removed.length}`);
  
  // Store transactions
  for (const t of added) {
    const tx = {
      id: t.transaction_id,
      account_id: t.account_id,
      amount: t.amount,
      name: t.name,
      date: t.date,
      category: t.personal_finance_category?.primary || t.category?.[0] || 'Uncategorized',
      merchant_name: t.merchant_name || t.name,
      pending: t.pending || false,
      currency: t.iso_currency_code || 'USD'
    };
    const { error } = await supabase.from('transactions').upsert(tx, { onConflict: 'id' });
    if (error) console.log('TX insert error:', error.message);
  }
  
  // Update cursor
  await supabase.from('plaid_items').update({ cursor }).eq('id', item.id);
  
  // Update account balances
  const balResp = await plaid.accountsBalanceGet({ access_token: item.access_token });
  for (const acct of balResp.data.accounts) {
    await supabase.from('accounts').update({
      balance_current: acct.balances.current,
      balance_available: acct.balances.available,
      balance_limit: acct.balances.limit,
      currency: acct.balances.iso_currency_code || 'USD'
    }).eq('plaid_account_id', acct.account_id);
  }
  
  const { count } = await supabase.from('transactions').select('*',{count:'exact',head:true});
  const { data: accts } = await supabase.from('accounts').select('*');
  console.log(`\nDone. Transactions: ${count}, Accounts updated: ${accts?.length || 0}`);
  accts?.forEach(a => console.log(`  ${a.name}: $${a.balance_current}`));
}

sync().catch(console.error);
