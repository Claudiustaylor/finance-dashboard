import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

export async function GET() {
  const results: any = {
    env: {
      url_present: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      key_present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      plaid_env: process.env.PLAID_ENV,
      app_url: process.env.NEXT_PUBLIC_APP_URL,
    },
    tests: [],
  };

  try {
    // Test 1: Simple select
    const { data: selectData, error: selectError } = await supabaseAdmin()
      .from('plaid_items')
      .select('id')
      .limit(1);
    results.tests.push({ name: 'select', ok: !selectError, error: selectError?.message });

    // Test 2: Insert a test row
    const testId = 'test-' + Date.now();
    const { data: insertData, error: insertError } = await supabaseAdmin()
      .from('plaid_items')
      .insert({
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        plaid_item_id: testId,
        plaid_access_token: 'access-test',
        plaid_institution_id: 'ins_109508',
        institution_name: 'Capital One',
        status: 'active',
      })
      .select()
      .single();
    results.tests.push({ name: 'insert', ok: !insertError, error: insertError?.message, data: insertData });

    // Clean up
    if (!insertError && insertData?.id) {
      await supabaseAdmin().from('plaid_items').delete().eq('id', insertData.id);
      results.tests.push({ name: 'cleanup', ok: true });
    }

    // Test 3: Check accounts table insert
    const { error: accountsError } = await supabaseAdmin()
      .from('accounts')
      .insert({
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        plaid_item_id: '00000000-0000-0000-0000-000000000000',
        plaid_account_id: 'acct-test',
        name: 'Test Account',
        type: 'depository',
        current_balance: 100,
      });
    results.tests.push({ name: 'accounts_insert', ok: !accountsError, error: accountsError?.message });

    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
