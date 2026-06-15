import { NextRequest, NextResponse } from 'next/server';
import { getPlaidEnv, plaidBaseUrl } from '@/lib/plaid-env';
import { normalizeUserId } from '@/lib/user-id';

const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || '';
const PLAID_SECRET = process.env.PLAID_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const env = getPlaidEnv(request);
    const baseUrl = plaidBaseUrl(env);

    const response = await fetch(`${baseUrl}/link/token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        user: { client_user_id: userId },
        client_name: 'Titan Finance',
        products: ['transactions', 'auth', 'liabilities'],
        country_codes: ['US'],
        language: 'en',
        transactions: { days_requested: 730 },
        webhook: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/plaid/webhook`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Plaid link token error:', JSON.stringify(data));
      return NextResponse.json(
        { error: data.error_message || 'Plaid API error', plaid_error_code: data.error_code },
        { status: response.status }
      );
    }

    return NextResponse.json({ link_token: data.link_token, expiration: data.expiration });
  } catch (error) {
    console.error('Plaid link token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
