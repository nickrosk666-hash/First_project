import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import https from 'https';

const DB_PATH = path.join(process.cwd(), 'data', 'ideas.db');

function callClaude(prompt: string, model = 'claude-sonnet-4-6'): Promise<string> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
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

const WEIGHTS = {
  market: 0.15, automation: 0.15, pain: 0.20,
  competition: 0.10, willingnessToPay: 0.15,
  margin: 0.10, build: 0.08, timing: 0.07,
};

function computeComposite(scores: Record<string, { value: number }>) {
  let composite = 0;
  for (const [k, w] of Object.entries(WEIGHTS)) {
    composite += (scores[k]?.value ?? 0) * w;
  }
  return Math.round(composite * 10) / 10;
}

function getVerdict(score: number) {
  if (score >= 7.5) return 'BUILD';
  if (score >= 6.0) return 'BET';
  if (score >= 4.0) return 'FLIP';
  return 'KILL';
}

function mapRow(r: Record<string, unknown>) {
  return {
    id: r.id, title: r.title, description: r.description,
    source: r.source, sourceUrl: r.source_url,
    scoreComposite: r.score_composite, verdict: r.verdict,
    verdictReason: r.verdict_reason, status: r.status,
    discoveredAt: r.discovered_at,
    isFavorite: Boolean(r.is_favorite),
    deletedAt: r.deleted_at ?? null,
    scores: {
      market: r.score_market, automation: r.score_automation,
      pain: r.score_pain_level, competition: r.score_competition,
      willingnessToPay: r.score_willingness_to_pay, margin: r.score_margin,
      build: r.score_build, timing: r.score_timing,
    },
    detail: r.business_plan ? (() => { try { return JSON.parse(r.business_plan as string); } catch { return null; } })() : null,
    scoreReasoning: r.score_reasoning ? (() => { try { return JSON.parse(r.score_reasoning as string); } catch { return null; } })() : null,
  };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
  }

  let idea: Record<string, unknown>;
  try {
    const db = new Database(DB_PATH, { readonly: true });
    const row = db.prepare('SELECT * FROM ideas WHERE id = ?').get(numId) as Record<string, unknown> | undefined;
    db.close();
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    idea = row;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  // ── Pass 1: Deep market research ─────────────────────────────────────────
  const researchPrompt = `You are a senior SaaS market analyst. Research this business idea for the US, Canadian, and Australian markets ONLY.

Idea: "${idea.title}"
Description: "${idea.description || idea.title}"

Analyze deeply and respond in Russian with specific facts and numbers:

1. РЫНОК: Реальный размер рынка в USD (TAM/SAM) в США, Канаде, Австралии. Темп роста. Конкретные цифры.
2. КОНКУРЕНТЫ: Назови 3-5 реальных конкурентов с их ценами и долями рынка. Где есть пробелы?
3. БОЛЬ КЛИЕНТА: Насколько острая проблема? Что сейчас используют? Почему это плохо?
4. ГОТОВНОСТЬ ПЛАТИТЬ: Типичные бюджеты на подобные решения в США/CA/AU. Примеры ценообразования у конкурентов.
5. АВТОМАТИЗАЦИЯ: Какую долю работы можно автоматизировать с AI? Конкретно что именно.
6. МАРЖИНАЛЬНОСТЬ: Типичная маржа для такого SaaS (gross margin %). Структура расходов.
7. СЛОЖНОСТЬ MVP: Что нужно для минимального рабочего продукта? Какие технические риски?
8. ТАЙМИНГ: Почему сейчас? Или почему рано/поздно? Конкретные триггеры рынка.

Будь честным и критичным. Если идея слабая — скажи прямо.`;

  let research: string;
  try {
    research = await callClaude(researchPrompt);
  } catch (e) {
    return NextResponse.json({ error: `Research pass failed: ${String(e)}` }, { status: 500 });
  }

  // ── Pass 2: Score with evidence ──────────────────────────────────────────
  const scoringPrompt = `You are a strict SaaS investment analyst. Based on this market research, score the idea.

IDEA: "${idea.title}"

MARKET RESEARCH:
${research}

Score each criterion 0-10 for US/Canada/Australia markets. Be strict — 8+ only for truly exceptional cases.

Scoring guidelines:
- market: 0=niche <$10M, 5=$100M-1B, 8=$1B-10B, 10=$10B+ TAM
- automation: 0=manual only, 5=partially automatable, 8=mostly automated, 10=fully autonomous
- pain: 0=nice-to-have, 5=real inconvenience, 8=significant cost/time waste, 10=critical blocker
- competition: 0=dominated by giants, 5=some competitors, 8=fragmented market, 10=blue ocean
- willingnessToPay: 0=expect free, 5=$50-100/mo, 8=$200-500/mo, 10=$1000+/mo
- margin: 0=<30%, 5=50-60%, 8=75-85%, 10=90%+
- build: 0=needs 10+ engineers/2+ years, 5=small team 6mo, 8=1-2 devs 2-3mo, 10=solo 1 month
- timing: 0=wrong time (too early/late), 5=ok timing, 8=good timing, 10=perfect window right now

Reply ONLY with this JSON (no markdown, no explanation outside JSON):
{
  "scores": {
    "market": {"value": 7, "reason": "Конкретное обоснование с цифрами"},
    "automation": {"value": 8, "reason": "Конкретное обоснование"},
    "pain": {"value": 7, "reason": "Конкретное обоснование"},
    "competition": {"value": 6, "reason": "Конкретное обоснование с конкурентами"},
    "willingnessToPay": {"value": 7, "reason": "Конкретное обоснование с ценами"},
    "margin": {"value": 8, "reason": "Конкретное обоснование с %"},
    "build": {"value": 7, "reason": "Конкретное обоснование"},
    "timing": {"value": 6, "reason": "Конкретное обоснование"}
  },
  "verdict_reason": "2-3 предложения: главный аргумент за/против этой идеи на рынке США/CA/AU",
  "risks": ["Риск 1", "Риск 2", "Риск 3"]
}`;

  let scoringText: string;
  try {
    scoringText = await callClaude(scoringPrompt);
  } catch (e) {
    return NextResponse.json({ error: `Scoring pass failed: ${String(e)}` }, { status: 500 });
  }

  const match = scoringText.match(/\{[\s\S]*\}/);
  if (!match) {
    return NextResponse.json({ error: 'Could not parse scoring JSON from Claude response' }, { status: 500 });
  }

  let result: { scores: Record<string, { value: number; reason: string }>; verdict_reason: string; risks: string[] };
  try {
    result = JSON.parse(match[0]);
  } catch (e) {
    return NextResponse.json({ error: `Invalid JSON from Claude: ${String(e)}` }, { status: 500 });
  }

  const scores = result.scores;
  const composite = computeComposite(scores);
  const verdict = getVerdict(composite);

  const reasoning = {
    ...scores,
    risks: result.risks,
    researchSummary: research.slice(0, 800),
  };

  try {
    const db = new Database(DB_PATH);
    db.prepare(`
      UPDATE ideas SET
        score_market = ?, score_automation = ?, score_pain_level = ?,
        score_competition = ?, score_willingness_to_pay = ?, score_margin = ?,
        score_build = ?, score_timing = ?, score_composite = ?,
        verdict = ?, verdict_reason = ?, score_reasoning = ?
      WHERE id = ?
    `).run(
      scores.market.value, scores.automation.value, scores.pain.value,
      scores.competition.value, scores.willingnessToPay.value, scores.margin.value,
      scores.build.value, scores.timing.value, composite,
      verdict, result.verdict_reason, JSON.stringify(reasoning),
      numId
    );
    const updated = db.prepare('SELECT * FROM ideas WHERE id = ?').get(numId) as Record<string, unknown>;
    db.close();
    return NextResponse.json(mapRow(updated));
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
