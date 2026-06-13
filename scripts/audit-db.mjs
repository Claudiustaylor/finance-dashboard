import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function audit() {
  // Count all tables
  const tables = ['plaid_items','accounts','transactions','item_holdings','users'];
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`${t}: ${count || 0}${error ? ' ERROR: '+error.message : ''}`);
  }
  
  // List plaid_items
  const { data: items, error: itemsErr } = await supabase.from('plaid_items').select('*');
  if (itemsErr) console.log('plaid_items error:', itemsErr.message);
  else {
    console.log('\n--- PLAID ITEMS ---');
    items.forEach(i => console.log(`id=${i.id} | item_id=${i.item_id?.slice(0,20)}... | inst=${i.institution_name} | user=${i.user_id} | status=${i.status}`));
  }
  
  // List accounts
  const { data: accts, error: acctsErr } = await supabase.from('accounts').select('*,plaid_items(institution_name)');
  if (acctsErr) console.log('accounts error:', acctsErr.message);
  else {
    console.log('\n--- ACCOUNTS ---');
    accts.forEach(a => console.log(`id=${a.id} | name=${a.name} | mask=${a.mask} | type=${a.type}/${a.subtype} | balance=$${a.balance_current} | inst=${a.plaid_items?.institution_name}`));
  }
  
  // List transactions
  const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
  console.log(`\nTransactions: ${txCount}`);
}

audit();
