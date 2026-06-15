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
    const normalizedUserId = normalizeUserId(userId);

    if (!public_token || !normalizedUserId) {
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

    const accessToken = exchangeData.access_token;
    const sb = supabaseAdmin();

    // Resolve institution_id from Plaid if the frontend didn't send it
    let institutionId = institution?.institution_id || '';
    let institutionName = institution?.name || 'Unknown';

    if (!institutionId) {
      try {
        const itemResp = await fetch(`${baseUrl}/item/get`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: PLAID_CLIENT_ID,
            secret: PLAID_SECRET,
            access_token: accessToken,
          }),
        });
        const itemData = await itemResp.json();
        if (itemResp.ok && itemData.item?.institution_id) {
          institutionId = itemData.item.institution_id;
        }
      } catch (e) {
        console.error('Failed to fetch item institution_id:', e);
      }
    }

    if (institutionId && !institutionName) {
      try {
        const instResp = await fetch(`${baseUrl}/institutions/get_by_id`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: PLAID_CLIENT_ID,
            secret: PLAID_SECRET,
            institution_id: institutionId,
            country_codes: ['US'],
          }),
        });
        const instData = await instResp.json();
        if (instResp.ok && instData.institution?.name) {
          institutionName = instData.institution.name;
        }
      } catch (e) {
        console.error('Failed to fetch institution name:', e);
      }
    }

    // Fetch accounts before insert so we can detect duplicate accounts too
    const accountsResponse = await fetch(`${baseUrl}/accounts/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: accessToken,
      }),
    });

    const accountsData = await accountsResponse.json();
    const incomingAccountIds = new Set((accountsData.accounts || []).map((a: any) => a.account_id));

    // Duplicate detection: same institution_id OR overlapping account ids for this user
    let existingItem = null;
    if (institutionId) {
      const { data } = await sb
        .from('plaid_items')
        .select('id, institution_name, plaid_institution_id')
        .eq('user_id', normalizedUserId)
        .eq('plaid_institution_id', institutionId)
        .eq('status', 'active')
        .maybeSingle();
      existingItem = data;
    }

    if (!existingItem && incomingAccountIds.size > 0) {
      const { data: existingAccounts } = await sb
        .from('accounts')
        .select('plaid_account_id, plaid_item_id, plaid_items!inner(user_id, status)')
        .eq('plaid_items.user_id', normalizedUserId)
        .eq('plaid_items.status', 'active')
        .in('plaid_account_id', Array.from(incomingAccountIds));

      if ((existingAccounts || []).length > 0) {
        const firstAccount = existingAccounts![0];
        const { data: item } = await sb
          .from('plaid_items')
          .select('id, institution_name')
          .eq('id', firstAccount.plaid_item_id)
          .maybeSingle();
        existingItem = item;
      }
    }

    if (existingItem) {
      return NextResponse.json({
        success: false,
        already_connected: true,
        institution_name: existingItem.institution_name,
        message: `${existingItem.institution_name || 'This bank'} is already connected. If you have new accounts, sync from the dashboard.`,
      }, { status: 409 });
    }

    // Store plaid item in database
    const { data: plaidItem, error: insertError } = await sb
      .from('plaid_items')
      .insert({
        user_id: normalizedUserId,
        plaid_item_id: exchangeData.item_id,
        plaid_access_token: accessToken,
        plaid_institution_id: institutionId || null,
        institution_name: institutionName,
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

    if (accountsResponse.ok && accountsData.accounts) {
      const accountsToInsert = accountsData.accounts.map((account: any) => ({
        user_id: normalizedUserId,
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

      const { error: accountsError } = await sb
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
      institution_name: institutionName,
    });
  } catch (error) {
    console.error('Exchange token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
