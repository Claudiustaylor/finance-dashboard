import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPlaidEnv, plaidBaseUrl } from '@/lib/plaid-env';
import { normalizeUserId } from '@/lib/user-id';

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || '';
const PLAID_SECRET = process.env.PLAID_SECRET || '';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { public_token, userId, institution } = body;

    if (!public_token || !userId) {
      return NextResponse.json(
        { error: 'public_token and userId are required' },
        { status: 400 }
      );
    }

    const env = getPlaidEnv(request);
    const baseUrl = plaidBaseUrl(env);

    // Exchange public token for access token
    const exchangeResponse = await fetch(`${baseUrl}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        public_token,
      }),
    });

    const exchangeData = await exchangeResponse.json();

    if (!exchangeResponse.ok) {
      console.error('Plaid exchange error:', JSON.stringify(exchangeData));
      return NextResponse.json(
        { error: exchangeData.error_message || 'Token exchange failed', plaid_error_code: exchangeData.error_code },
        { status: exchangeResponse.status }
      );
    }

    // Store plaid item in database
    const { data: plaidItem, error: insertError } = await supabaseAdmin()
      .from('plaid_items')
      .insert({
        user_id: userId,
        plaid_item_id: exchangeData.item_id,
        plaid_access_token: exchangeData.access_token,
        plaid_institution_id: institution?.institution_id || null,
        institution_name: institution?.name || 'Unknown',
        status: 'active',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', JSON.stringify(insertError));
      return NextResponse.json(
        { error: 'Failed to store plaid item: ' + insertError.message, details: insertError },
        { status: 500 }
      );
    }

    // Fetch accounts for this item
    const accountsResponse = await fetch(`${baseUrl}/accounts/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: exchangeData.access_token,
      }),
    });

    const accountsData = await accountsResponse.json();

    if (accountsResponse.ok && accountsData.accounts) {
      const accountsToInsert = accountsData.accounts.map((account: any) => ({
        user_id: userId,
        plaid_item_id: plaidItem.id,
        plaid_account_id: account.account_id,
        name: account.name,
        official_name: account.official_name || null,
        type: account.type,
        subtype: account.subtype || null,
        mask: account.mask || null,
        current_balance: account.balances.current || 0,
        available_balance: account.balances.available || 0,
        currency_code: account.balances.iso_currency_code || 'USD',
      }));

      const { error: accountsError } = await supabaseAdmin()
        .from('accounts')
        .insert(accountsToInsert);

      if (accountsError) {
        console.error('Accounts insert error:', accountsError);
      }
    }

    return NextResponse.json({
      success: true,
      plaid_item_id: exchangeData.item_id,
      item_db_id: plaidItem.id,
    });
  } catch (error) {
    console.error('Exchange token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
