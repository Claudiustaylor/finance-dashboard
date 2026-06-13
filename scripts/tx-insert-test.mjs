import { createClient } from '@supabase/supabase-js';
const sup = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const { data: accts } = await sup.from('accounts').select('id, plaid_account_id');
const acctMap = {};
accts?.forEach(a => acctMap[a.plaid_account_id] = a.id);

const { data: item } = await sup.from('plaid_items').select('user_id').single();
const acctUUID = acctMap['33RV1Rajp5cP4z9EmNmDt8nJgYMxPJtMNKY7Bq'];

const { error } = await sup.from('transactions').insert({
  id: crypto.randomUUID(),
  plaid_transaction_id: 'KXvoMvgJzehpEd1DeqeotLg9JdabEmIKjpkZdQ',
  user_id: item.user_id,
  account_id: acctUUID,
  amount: -0.01,
  currency_code: 'USD',
  name: 'Monthly Interest Paid',
  date: '2026-05-31',
  pending: false
});
console.log('Insert result:', error ? error.message : 'SUCCESS');
if (error?.details) console.log('Details:', error.details);
if (error?.hint) console.log('Hint:', error.hint);
