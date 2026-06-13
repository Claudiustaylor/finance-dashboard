import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function clean() {
  // 1. Find the most recent real Capital One item (non-demo)
  const { data: items } = await supabase.from('plaid_items').select('*').neq('user_id','550e8400-e29b-41d4-a716-446655440000').order('created_at',{ascending:false});
  
  if (!items || items.length === 0) {
    console.log('No real plaid_items found. Keeping all for now.');
    return;
  }
  
  const keep = items[0];
  const deleteItems = items.slice(1);
  
  console.log(`Keeping: ${keep.id} (created ${keep.created_at})`);
  console.log(`Deleting ${deleteItems.length} duplicate(s)`);
  
  // 2. Delete duplicate items
  for (const d of deleteItems) {
    const { error } = await supabase.from('plaid_items').delete().eq('id', d.id);
    console.log(`Deleted duplicate ${d.id}: ${error ? error.message : 'OK'}`);
  }
  
  // 3. Delete the fake demo-user item
  const { error: demoErr } = await supabase.from('plaid_items').delete().eq('user_id','550e8400-e29b-41d4-a716-446655440000');
  console.log(`Deleted demo-user item: ${demoErr ? demoErr.message : 'OK'}`);
  
  // 4. Delete orphan accounts (not linked to kept item)
  const { error: acctDel } = await supabase.from('accounts').delete().neq('plaid_item_id', keep.id);
  console.log(`Deleted orphan accounts: ${acctDel ? acctDel.message : 'OK'}`);
  
  // 5. Delete all transactions (will re-sync fresh)
  const { error: txDel } = await supabase.from('transactions').delete().neq('id','00000000-0000-0000-0000-000000000000');
  console.log(`Deleted all transactions: ${txDel ? txDel.message : 'OK'}`);
  
  // 6. Verify cleanup
  const { data: verify } = await supabase.from('plaid_items').select('*');
  console.log(`\nRemaining plaid_items: ${verify?.length || 0}`);
  verify?.forEach(i => console.log(`  - ${i.institution_name} | ${i.id}`));
  
  const { data: v2 } = await supabase.from('accounts').select('*');
  console.log(`Remaining accounts: ${v2?.length || 0}`);
  
  const { count: v3 } = await supabase.from('transactions').select('*',{count:'exact',head:true});
  console.log(`Remaining transactions: ${v3}`);
}

clean();
