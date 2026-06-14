import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizeUserId } from '@/lib/user-id';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'https://ollama.com/v1';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';
const OLLAMA_MODEL = process.env.OLLAMA_CHAT_MODEL || 'kimi-k2.7-code';

function getUserId(req: NextRequest): string | null {
  return normalizeUserId(req.headers.get("x-titan-user-id") || req.headers.get("x-user-id"));
}

async function callOllamaChat(messages: any[], tools?: any[], stream = false) {
  const response = await fetch(`${OLLAMA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      ...(tools && tools.length > 0 ? { tools } : {}),
      stream,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'unknown');
    throw new Error(`Ollama chat failed: ${response.status} ${text}`);
  }
  return response;
}

// ===== Tool definitions exposed to the AI =====
const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'query_transactions',
      description: 'Query user transactions with optional filters',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max rows to return' },
          start_date: { type: 'string', description: 'ISO start date' },
          end_date: { type: 'string', description: 'ISO end date' },
          min_amount: { type: 'number' },
          max_amount: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_gl',
      description: 'Query the chart of accounts / GL accounts',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Filter by account type' },
          limit: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_recurring',
      description: 'List recurring transaction rules for the user',
      parameters: {
        type: 'object',
        properties: { limit: { type: 'number' } },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_anomalies',
      description: 'Run anomaly detection over user transactions',
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'Number of days to scan' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'run_reconciliation',
      description: 'Run account reconciliation for the user',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

async function executeTool(
  name: string,
  args: any,
  userId: string
): Promise<{ result: any; error?: string }> {
  const sb = supabaseAdmin();
  try {
    switch (name) {
      case 'query_transactions': {
        let q = sb.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false });
        if (args.start_date) q = q.gte('date', args.start_date);
        if (args.end_date) q = q.lte('date', args.end_date);
        if (args.min_amount !== undefined) q = q.gte('amount', args.min_amount);
        if (args.max_amount !== undefined) q = q.lte('amount', args.max_amount);
        if (args.limit) q = q.limit(args.limit);
        const { data, error } = await q;
        return { result: error ? { error: error.message } : data || [] };
      }
      case 'query_gl': {
        let q = sb.from('gl_accounts').select('*').eq('user_id', userId).order('code');
        if (args.type) q = q.eq('type', args.type);
        if (args.limit) q = q.limit(args.limit);
        const { data, error } = await q;
        return { result: error ? { error: error.message } : data || [] };
      }
      case 'query_recurring': {
        const { data, error } = await sb
          .from('recurring_rules')
          .select('*')
          .eq('user_id', userId)
          .order('next_expected_date', { ascending: true })
          .limit(args.limit || 50);
        return { result: error ? { error: error.message } : data || [] };
      }
      case 'query_anomalies': {
        const { data, error } = await sb
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .gte('date', new Date(Date.now() - (args.days || 90) * 86400000).toISOString().split('T')[0])
          .order('amount', { ascending: false })
          .limit(500);
        if (error) return { result: { error: error.message } };
        const flagged = detectAnomalies(data || []);
        return { result: flagged };
      }
      case 'run_reconciliation': {
        const result = await runReconciliation(userId);
        return { result };
      }
      default:
        return { result: null, error: `Unknown tool: ${name}` };
    }
  } catch (e: any) {
    return { result: null, error: e.message };
  }
}

function detectAnomalies(transactions: any[]) {
  const reasons: Record<string, string[]> = {};
  const seen = new Map<string, number>();
  const amounts: number[] = transactions.map((t) => Number(t.amount || 0));
  const avg = amounts.reduce((a, b) => a + b, 0) / (amounts.length || 1);
  const std = Math.sqrt(
    amounts.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / (amounts.length || 1)
  ) || 0;

  for (const t of transactions) {
    const list: string[] = [];
    const key = `${t.merchant_name || t.name}|${t.amount}|${t.date}`;
    seen.set(key, (seen.get(key) || 0) + 1);
    if (seen.get(key)! > 1) list.push('Possible duplicate transaction');
    const amount = Number(t.amount || 0);
    if (avg > 0 && amount > avg + 3 * std && std > 0) list.push('Unusually large amount spike');
    if (amount > avg * 5 && avg > 0) list.push('Amount is 5x the average');
    if (t.pending) list.push('Transaction still pending');
    reasons[t.id] = list;
  }

  return transactions
    .map((t) => ({ ...t, reasons: reasons[t.id] || [] }))
    .filter((t) => t.reasons.length > 0);
}

async function runReconciliation(userId: string) {
  const sb = supabaseAdmin();
  const { data: txs } = await sb
    .from('transactions')
    .select('id, account_id, amount, date, name, pending')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1000);

  const { data: accts } = await sb.from('accounts').select('id, current_balance').eq('user_id', userId);
  const balances: Record<string, number> = {};
  accts?.forEach((a: any) => (balances[a.id] = Number(a.current_balance || 0)));

  const updates: any[] = [];
  for (const t of txs || []) {
    const status = t.pending ? 'pending' : 'matched';
    updates.push({
      user_id: userId,
      transaction_id: t.id,
      status,
      discrepancy_amount: 0,
    });
  }

  for (const up of updates) {
    await sb.from('reconciliation_status').upsert(up, { onConflict: 'transaction_id' });
  }

  return { reconciled: updates.length, accounts: accts?.length || 0 };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], conversation_id, stream = false } = body;
    const userId = getUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 401 });
    }

    const sb = supabaseAdmin();

    // Ensure conversation exists
    let convId = conversation_id;
    if (!convId) {
      const { data: conv } = await sb
        .from('ai_conversations')
        .insert({ user_id: userId, title: body.title || 'New chat' })
        .select('id')
        .single();
      if (conv) convId = conv.id;
    }

    if (!convId) {
      return NextResponse.json({ error: 'Could not create conversation' }, { status: 500 });
    }

    // Save user message
    const lastUserMessage = messages.findLast((m: any) => m.role === 'user');
    if (lastUserMessage) {
      await sb.from('ai_messages').insert({
        conversation_id: convId,
        role: 'user',
        content: lastUserMessage.content,
      });
    }

    const systemPrompt = {
      role: 'system',
      content:
        'You are Titan Finance AI, a bookkeeping assistant. Use the provided tools to query transactions, GL accounts, recurring rules, anomalies, and reconciliation. Be concise and cite amounts/dates when possible.',
    };

    const ollamaMessages = [systemPrompt, ...messages];
    const response = await callOllamaChat(ollamaMessages, TOOLS, stream);

    if (stream) {
      // Forward streaming response from Ollama and persist final assistant chunk in background is hard; return raw stream.
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const completion = await response.json();
    const assistantMessage = completion.choices?.[0]?.message || {};

    // Some Ollama models (e.g. kimi-k2.7-code) return reasoning in a separate field
    if (!assistantMessage.content && assistantMessage.reasoning) {
      assistantMessage.content = assistantMessage.reasoning;
    }

    // Handle tool calls
    let toolResults: any[] = [];
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      toolResults = await Promise.all(
        assistantMessage.tool_calls.map(async (tc: any) => {
          const args = JSON.parse(tc.function.arguments || '{}');
          const { result, error } = await executeTool(tc.function.name, args, userId);
          return { tool_call_id: tc.id, name: tc.function.name, result, error };
        })
      );

      // Re-call model with tool results
      const secondResponse = await callOllamaChat(
        [
          ...ollamaMessages,
          assistantMessage,
          ...toolResults.map((r) => ({
            role: 'tool',
            tool_call_id: r.tool_call_id,
            name: r.name,
            content: JSON.stringify(r.result || { error: r.error }),
          })),
        ],
        [],
        false
      );
      const secondCompletion = await secondResponse.json();
      const finalMessage = secondCompletion.choices?.[0]?.message || {};
      if (!finalMessage.content && finalMessage.reasoning) {
        finalMessage.content = finalMessage.reasoning;
      }

      await sb.from('ai_messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: finalMessage.content || finalMessage.reasoning || '',
        tool_calls: assistantMessage.tool_calls,
      });

      return NextResponse.json({
        conversation_id: convId,
        message: finalMessage,
        tool_results: toolResults,
      });
    }

    await sb.from('ai_messages').insert({
      conversation_id: convId,
      role: 'assistant',
      content: assistantMessage.content || assistantMessage.reasoning || '',
    });

    return NextResponse.json({
      conversation_id: convId,
      message: assistantMessage,
    });
  } catch (err: any) {
    console.error('/api/ai/chat error:', err);
    return NextResponse.json({ error: err.message || 'AI chat failed' }, { status: 500 });
  }
}
