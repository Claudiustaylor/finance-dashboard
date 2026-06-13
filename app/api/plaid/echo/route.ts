import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Echo back exactly what we received
    return NextResponse.json({
      received: body,
      headers: Object.fromEntries(request.headers.entries()),
      url: request.url,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, raw: await request.text() }, { status: 500 });
  }
}
