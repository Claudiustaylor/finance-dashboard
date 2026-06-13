const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  const { data: items, error: iErr } = await supabase.from('plaid_items')
    .select('id, user_id, plaid_item_id, institution_name, status, transactions_cursor, last_synced_at')
    .order('created_at', { ascending: false });
  if (iErr) console.error('items error:', iErr);
  console.log('plaid_items:', JSON.stringify(items, null, 2));

  const { data: accs, error: aErr } = await supabase.from('accounts')
    .select('id, user_id, plaid_item_id, plaid_account_id, name, type, current_balance')
    .order('created_at', { ascending: false });
  if (aErr) console.error('accounts error:', aErr);
  console.log('accounts:', JSON.stringify(accs, null, 2));

  const { data: tx, error: tErr } = await supabase.from('transactions').select('count');
  console.log('transactions count:', tx, 'error:', tErr);
})();