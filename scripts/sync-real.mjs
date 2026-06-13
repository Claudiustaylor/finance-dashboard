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
  const { data: item, error } = await supabase.from('plaid_items').select('*,plaid_access_token,plaid_item_id').single();
  if (error || !item) { console.log('No item:', error?.message); return; }
  
  console.log(`Item: ${item.plaid_item_id?.slice(0,20)}... | User: ${item.user_id}`);
  
  // Get balance first
  const bal = await plaid.accountsBalanceGet({ access_token: item.plaid_access_token });
  console.log(`Accounts: ${bal.data.accounts.length}`);
  
  for (const acct of bal.data.accounts) {
    console.log(`  ${acct.name} (${acct.mask}): $${acct.balances.current}`);
    await supabase.from('accounts').upsert({
      id: acct.account_id,
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
  }
  
  // Get transactions (using /transactions/get instead of sync for simplicity)
  const end = new Date().toISOString().split('T')[0];
  const start = new Date(Date.now() - 90*24*60*60*1000).toISOString().split('T')[0];
  
  const txResp = await plaid.transactionsGet({
    access_token: item.plaid_access_token,
    start_date: start,
    end_date: end,
    options: { count: 100, offset: 0 }
  });
  
  const txs = txResp.data.transactions || [];
  console.log(`Transactions fetched: ${txs.length}`);
  
  for (const t of txs) {
    await supabase.from('transactions').upsert({
      id: t.transaction_id,
      account_id: t.account_id,
      amount: t.amount,
      name: t.name,
      date: t.date,
      category: t.personal_finance_category?.primary || t.category?.[0] || 'Uncategorized',
      merchant_name: t.merchant_name || t.name,
      pending: t.pending || false,
      currency: t.iso_currency_code || 'USD'
    }, { onConflict: 'id' });
  }
  
  await supabase.from('plaid_items').update({ last_synced_at: new Date().toISOString() }).eq('id', item.id);
  
  // Verify
  const { data: accts } = await supabase.from('accounts').select('*');
  const { count } = await supabase.from('transactions').select('*',{count:'exact',head:true});
  console.log(`\nDONE — Accounts: ${accts?.length}, Transactions: ${count}`);
  accts?.forEach(a=>console.log(`  $${a.current_balance} — ${a.name} (${a.mask})`));
}

sync().catch(e=>console.error(e.response?.data || e.message));
