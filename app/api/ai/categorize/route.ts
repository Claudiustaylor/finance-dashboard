import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'https://ollama.com/v1';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';
const OLLAMA_MODEL = process.env.OLLAMA_CHAT_MODEL || 'kimi-k2.7-code';

function getUserId(req: NextRequest): string | null {
  return req.headers.get('x-titan-user-id') || req.headers.get('x-user-id') || null;
}

async function suggestCategory(transaction: any) {
  const prompt = `You are a bookkeeping assistant. Given this bank transaction, suggest a chart of accounts GL account.
Return ONLY a JSON object with keys: gl_account_code, gl_account_name, category, confidence (0-1).

Transaction:
Name: ${transaction.name || transaction.merchant_name || 'Unknown'}
Amount: ${transaction.amount}
Date: ${transaction.date}
Plaid category: ${transaction.plaid_category?.join(' > ') || 'unknown'}
`;

  const response = await fetch(`${OLLAMA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [{ role: 'system', content: 'You return only valid JSON.' }, { role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'unknown');
    throw new Error(`Ollama categorize failed: ${response.status} ${text}`);
  }

  const completion = await response.json();
  const raw = completion.choices?.[0]?.message?.content || '{}';
  try {
    return JSON.parse(raw);
  } catch {
    return { raw, parsed: null };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transaction_id, transaction } = body;
    const userId = getUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 401 });
    }
    if (!transaction_id) {
      return NextResponse.json({ error: 'transaction_id is required' }, { status: 400 });
    }

    const tx = transaction || { name: '', amount: 0, date: '', plaid_category: [] };
    const suggestion = await suggestCategory(tx);

    // Match GL account by code if possible
    let glAccountId: string | null = null;
    if (suggestion.gl_account_code) {
      const { data: acct } = await supabaseAdmin()
        .from('gl_accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('code', suggestion.gl_account_code)
        .single();
      if (acct) glAccountId = acct.id;
    }

    const { error } = await supabaseAdmin()
      .from('transactions')
      .update({
        suggested_gl_account_id: glAccountId,
        ai_category: suggestion.category || suggestion.gl_account_name,
        ai_confidence: Number(suggestion.confidence) || 0,
        ai_suggested_at: new Date().toISOString(),
      })
      .eq('id', transaction_id)
      .eq('user_id', userId);

    if (error) {
      console.error('Categorize update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      transaction_id,
      suggestion,
      suggested_gl_account_id: glAccountId,
    });
  } catch (err: any) {
    console.error('/api/ai/categorize error:', err);
    return NextResponse.json({ error: err.message || 'Categorization failed' }, { status: 500 });
  }
}
