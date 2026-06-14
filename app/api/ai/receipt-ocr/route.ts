import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizeUserId } from '@/lib/user-id';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'https://ollama.com/v1';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY || '';
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || 'gemini-3-flash-preview';

function getUserId(req: NextRequest): string | null {
  return normalizeUserId(req.headers.get("x-titan-user-id") || req.headers.get("x-user-id"));
}

function dataUriFromBase64(base64: string, mime = 'image/jpeg') {
  return `data:${mime};base64,${base64}`;
}

async function extractReceipt(imageUrlOrBase64: string) {
  const isBase64 = !imageUrlOrBase64.startsWith('http');
  const imageUrl = isBase64 ? dataUriFromBase64(imageUrlOrBase64) : imageUrlOrBase64;

  const prompt = `Extract receipt fields and return ONLY a JSON object with these keys:
merchant, date (YYYY-MM-DD), total_amount (number), tax_amount (number or null), items (array of {name, amount, qty}), confidence (0-1).`;

  const response = await fetch(`${OLLAMA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: OLLAMA_VISION_MODEL,
      messages: [
        { role: 'system', content: 'You are a receipt OCR assistant. Return only valid JSON.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => 'unknown');
    throw new Error(`Ollama vision failed: ${response.status} ${text}`);
  }

  const completion = await response.json();
  const raw = completion.choices?.[0]?.message?.content || '{}';
  try {
    return JSON.parse(raw);
  } catch {
    return { raw, parsed: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image_base64, file_url, transaction_id, mime_type = 'image/jpeg' } = body;
    const userId = getUserId(req);

    if (!userId) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 401 });
    }
    if (!image_base64 && !file_url) {
      return NextResponse.json({ error: 'image_base64 or file_url is required' }, { status: 400 });
    }

    const imageInput = image_base64 || file_url;
    const extracted = await extractReceipt(imageInput);

    const confidence = Number(extracted.confidence) || 0;
    const { data: receipt, error } = await supabaseAdmin()
      .from('receipts')
      .insert({
        user_id: userId,
        transaction_id: transaction_id || null,
        file_url: file_url || null,
        ocr_text: JSON.stringify(extracted),
        ocr_confidence: confidence,
        extracted_amount: extracted.total_amount || null,
        extracted_merchant: extracted.merchant || null,
        extracted_date: extracted.date || null,
        extracted_items: extracted.items || [],
        extracted_tax: extracted.tax_amount || null,
        extracted_total: extracted.total_amount || null,
        status: confidence > 0.7 ? 'processed' : 'review',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Receipt insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      receipt_id: receipt?.id,
      extracted,
      status: confidence > 0.7 ? 'processed' : 'review',
    });
  } catch (err: any) {
    console.error('/api/ai/receipt-ocr error:', err);
    return NextResponse.json({ error: err.message || 'Receipt OCR failed' }, { status: 500 });
  }
}
