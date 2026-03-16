import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const n8nUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/launch-idea';

  try {
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `n8n ответил ${response.status}: ${text}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Неизвестная ошибка';
    return NextResponse.json(
      { error: `Не удалось подключиться к n8n: ${msg}` },
      { status: 503 }
    );
  }
}
