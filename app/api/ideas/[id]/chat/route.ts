import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import https from 'https';

const DB_PATH = path.join(process.cwd(), 'data', 'ideas.db');

function callClaude(messages: { role: string; content: string }[], system: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system,
      messages,
    });
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      },
    }, res => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      res.on('end', () => {
        const d = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode !== 200) return reject(new Error(`API ${res.statusCode}: ${d}`));
        try { resolve(JSON.parse(d).content[0].text.trim()); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);

  try {
    const db = new Database(DB_PATH, { readonly: true });
    const rows = db.prepare(
      'SELECT role, content FROM chat_history WHERE idea_id = ? ORDER BY id ASC'
    ).all(numId) as { role: string; content: string }[];
    db.close();
    return NextResponse.json({ messages: rows });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  const { message } = await request.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  let idea: Record<string, unknown> | null = null;
  try {
    const db = new Database(DB_PATH, { readonly: true });
    idea = db.prepare('SELECT * FROM ideas WHERE id = ?').get(numId) as Record<string, unknown>;
    db.close();
  } catch {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }

  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });

  const detail = idea.business_plan
    ? (() => { try { return JSON.parse(idea.business_plan as string); } catch { return null; } })()
    : null;

  const system = `Ты — опытный бизнес-аналитик и эксперт по SaaS-стартапам. Тебе задают вопросы об идее для бизнеса.

ВАЖНО: Целевые рынки — ТОЛЬКО США, Канада, Австралия. Все советы, цифры, каналы продаж, регуляции, цены и примеры — только для этих рынков. Никогда не упоминай Россию, СНГ, Европу или другие рынки.

Идея: ${idea.title}
Описание: ${idea.description}
Вердикт: ${idea.verdict} (балл: ${idea.score_composite}/10)
Причина вердикта: ${idea.verdict_reason}
${detail ? `
Проблема: ${detail.problem}
Ценность: ${detail.valueProposition}
Аудитория: ${detail.targetAudience}
Ценообразование: ${detail.pricing}
Сроки: ${detail.estimatedTimeline}
Расходы: ${detail.estimatedCost}
Фичи: ${detail.features?.join(', ')}
Стек: ${detail.techStack?.join(', ')}
` : ''}

Отвечай чётко, по делу, на русском языке. Давай конкретные советы для рынков США/Канады/Австралии. Если спрашивают о рисках — говори прямо. Максимум 3-4 абзаца.

ФОРМАТИРОВАНИЕ: Пиши ТОЛЬКО plain text. НИКОГДА не используй markdown: никаких звёздочек, решёток, дефисов в начале строк, блоков кода. Если нужен список — нумеруй цифрами (1. 2. 3.) или перечисляй через запятую. Пиши как в обычном мессенджере.`;

  // Load history from DB
  const db = new Database(DB_PATH);
  const history = db.prepare(
    'SELECT role, content FROM chat_history WHERE idea_id = ? ORDER BY id ASC'
  ).all(numId) as { role: string; content: string }[];

  const messages = [...history, { role: 'user', content: message }];

  try {
    const reply = await callClaude(messages, system);

    // Save user message and reply
    const insert = db.prepare('INSERT INTO chat_history (idea_id, role, content, created_at) VALUES (?, ?, ?, ?)');
    const now = new Date().toISOString();
    insert.run(numId, 'user', message, now);
    insert.run(numId, 'assistant', reply, now);
    db.close();

    return NextResponse.json({ reply });
  } catch (e) {
    db.close();
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  try {
    const db = new Database(DB_PATH);
    db.prepare('DELETE FROM chat_history WHERE idea_id = ?').run(numId);
    db.close();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
