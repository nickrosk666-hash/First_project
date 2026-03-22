import Database from 'better-sqlite3';
import path from 'path';
import https from 'https';
import { firecrawlBatchSearch } from '@/lib/firecrawl';
import { callClaude, computeComposite, getVerdict } from '@/lib/claude';

const DB_PATH = path.join(process.cwd(), 'data', 'ideas.db');
const MIN_SCORE = 7.0;

function updateJob(id: string, fields: Record<string, unknown>) {
  const db = new Database(DB_PATH);
  const sets = Object.keys(fields).map((k) => `${k} = ?`).join(', ');
  db.prepare(`UPDATE jobs SET ${sets} WHERE id = ?`).run(
    ...Object.values(fields),
    id
  );
  db.close();
}

// ── Deduplication: check if a similar idea already exists ───────────────
function isDuplicate(db: Database.Database, title: string): boolean {
  // Normalize: lowercase, remove punctuation, trim
  const normalized = title.toLowerCase().replace(/[^a-zа-яё0-9\s]/gi, '').trim();
  const words = normalized.split(/\s+/).filter(w => w.length > 3);
  if (words.length === 0) return false;

  // Check if any existing idea shares 60%+ of significant words
  const existing = db.prepare(
    'SELECT title FROM ideas WHERE deleted_at IS NULL'
  ).all() as { title: string }[];

  for (const row of existing) {
    const existingWords = row.title.toLowerCase().replace(/[^a-zа-яё0-9\s]/gi, '').trim().split(/\s+/).filter(w => w.length > 3);
    if (existingWords.length === 0) continue;

    const overlap = words.filter(w => existingWords.includes(w)).length;
    const similarity = overlap / Math.min(words.length, existingWords.length);
    if (similarity >= 0.6) return true;
  }
  return false;
}

// ── Telegram notification ──────────────────────────────────────────────
async function sendTelegramNotification(
  savedIdeas: Array<{ title: string; verdict: string; composite: number }>
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const header = `🔍 *Idea Hunt — ${new Date().toLocaleDateString('ru-RU')}*\n`;
  const count = `Найдено: ${savedIdeas.length} идей (порог ${MIN_SCORE}+)\n\n`;

  const ideaLines = savedIdeas.map((idea, i) => {
    const emoji = idea.verdict === 'BUILD' ? '🟢' : idea.verdict === 'BET' ? '🟡' : '⚪';
    return `${emoji} *${idea.composite.toFixed(1)}* — ${idea.title}`;
  }).join('\n');

  const footer = `\n\n📊 [Открыть платформу](${process.env.PLATFORM_URL || 'http://localhost:3000'}/ideas)`;

  const text = header + count + ideaLines + footer;

  return new Promise<void>((resolve) => {
    const body = JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    });

    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, () => resolve());
    req.on('error', () => resolve());
    req.write(body);
    req.end();
  });
}

// ── Search queries ─────────────────────────────────────────────────────
const BASE_QUERIES = [
  'site:reddit.com "I would pay for" OR "someone should build" 2025 2026',
  'site:reddit.com r/SideProject OR r/indiehackers "revenue" OR "MRR" 2025',
  'site:reddit.com "micro saas" OR "built in a weekend" making money 2025',
  'best online business ideas 2025 2026 low cost high profit',
  'AI business ideas 2025 startup low budget automation agent',
  'telegram bot business revenue 2025 mini app monetization',
  'site:producthunt.com launched 2025 trending SaaS tool',
  'site:youtube.com "micro saas" OR "side project" revenue 2025',
  'profitable side project 2025 solo founder bootstrap under 100',
];

function getDirectionQueries(direction: string): string[] {
  return [
    `${direction} business idea 2025 2026 revenue profitable`,
    `site:reddit.com "${direction}" need tool solution 2025`,
    `${direction} startup low budget automation 2025`,
  ];
}

// ── Main hunt logic ────────────────────────────────────────────────────
export async function runHuntJob(jobId: string, direction?: string) {
  try {
    // ═══ Phase 1: Search ═══════════════════════════════════════════════
    updateJob(jobId, { status: 'searching', progress: 'Ищу в Reddit, Product Hunt, YouTube...' });

    const queries = [...BASE_QUERIES];
    if (direction) queries.push(...getDirectionQueries(direction));

    const searchResults = await firecrawlBatchSearch(queries, { limit: 5, batchSize: 3 });

    let allContent = '';
    let totalResults = 0;
    for (const [query, results] of searchResults) {
      if (results.length > 0) {
        allContent += `\n\n--- ${query} ---\n`;
        for (const r of results) {
          allContent += `\nURL: ${r.url}\nTitle: ${r.title}\n${r.markdown?.slice(0, 1500) || r.description || ''}\n`;
          totalResults++;
        }
      }
    }

    // ═══ Phase 2: Extract candidates (Pass 1) ═════════════════════════
    updateJob(jobId, { status: 'analyzing', progress: `${totalResults} результатов. Извлекаю кандидатов...` });

    const extractPrompt = `Ты — скаут стартап-акселератора. Из собранных данных извлеки ВСЕ потенциальные бизнес-идеи.
${direction ? `Фокус поиска: ${direction}` : ''}

ДАННЫЕ:
${allContent.slice(0, 30000)}

ПРАВИЛА:
- Извлеки 5-10 идей-кандидатов из данных
- Каждая идея должна иметь: подтверждённый спрос, путь к монетизации, MVP до $100
- НЕ выдумывай идеи — только то, что реально найдено в данных
- Для каждой укажи ОТКУДА она (URL, цитата, источник)

JSON (без markdown):
{
  "candidates": [
    {
      "title": "Название на русском",
      "description": "Что это и как работает (2-3 предложения)",
      "source_evidence": "Конкретная цитата/ссылка из данных, подтверждающая спрос",
      "competitors": "Кто уже делает, слабые места",
      "monetization": "Как зарабатывать"
    }
  ]
}`;

    const extractResponse = await callClaude(extractPrompt, { maxTokens: 4000 });
    const extractMatch = extractResponse.match(/\{[\s\S]*\}/);
    if (!extractMatch) throw new Error('Pass 1: Claude не вернул JSON');

    const candidates = JSON.parse(extractMatch[0]).candidates || [];
    if (candidates.length === 0) throw new Error('Не найдено ни одного кандидата');

    // ═══ Phase 3: Strict scoring (Pass 2) ═════════════════════════════
    updateJob(jobId, { status: 'analyzing', progress: `${candidates.length} кандидатов. Строгая оценка...` });

    const scorePrompt = `Ты — строгий инвестиционный аналитик. Оцени каждую идею ЧЕСТНО и КРИТИЧНО.

КАНДИДАТЫ:
${candidates.map((c: any, i: number) => `
${i + 1}. "${c.title}"
   Описание: ${c.description}
   Доказательства спроса: ${c.source_evidence}
   Конкуренты: ${c.competitors}
   Монетизация: ${c.monetization}
`).join('')}

ПРАВИЛА ОЦЕНКИ (будь СТРОГИМ):
- market: 0=ниша <$10M, 5=$100M-1B, 8=$1B+. Нужны реальные цифры.
- automation: 0=ручная работа, 5=частично, 8=почти полностью, 10=полностью автономно
- pain: 0=nice-to-have, 5=реальное неудобство, 8=серьёзные потери времени/денег, 10=критический блокер
- competition: 0=монополия (Google, Apple), 5=есть конкуренты, 8=фрагментированный, 10=никого
- willingnessToPay: 0=ждут бесплатно, 5=$50-100/мес, 8=$200+/мес
- margin: 0=<30%, 5=50-60%, 8=75%+
- build: 0=команда 10+ людей, 5=малая команда полгода, 8=1-2 dev 2-3 мес, 10=соло 1 мес
- timing: 0=рано/поздно, 5=нормально, 8=хороший момент, 10=идеальное окно

АНТИПРАВИЛА (обязательно соблюдай):
- НЕ ставь 8+ если нет конкретных данных (цифры выручки конкурентов, размер рынка)
- НЕ ставь 9+ по pain если нет цитат реальных людей с жалобами
- НЕ ставь 8+ по competition если есть хоть один игрок с >$10M funding
- 70% micro-SaaS не преодолевают $1K MRR — учитывай это
- Если сомневаешься — ставь НИЖЕ, не выше. Лучше пропустить хорошую идею, чем пропустить плохую.

JSON (без markdown):
{
  "scored": [
    {
      "title": "...",
      "description": "...",
      "format": "Telegram-бот / SaaS / AI-агент / ...",
      "demand_evidence": "...",
      "competitors": "...",
      "monetization": "...",
      "launch_cost": "$XX-YY",
      "potential_mrr": "$XXX-YYY через 6 мес (пессимистично)",
      "scores": {
        "market": {"value": 7, "reason": "Конкретное обоснование с цифрами"},
        "automation": {"value": 8, "reason": "..."},
        "pain": {"value": 7, "reason": "..."},
        "competition": {"value": 6, "reason": "..."},
        "willingnessToPay": {"value": 5, "reason": "..."},
        "margin": {"value": 8, "reason": "..."},
        "build": {"value": 8, "reason": "..."},
        "timing": {"value": 7, "reason": "..."}
      },
      "business_plan": {
        "problem": "...",
        "valueProposition": "...",
        "targetAudience": "...",
        "features": ["...", "..."],
        "techStack": ["...", "..."],
        "pricing": "...",
        "launchSteps": [{"step": 1, "title": "...", "description": "..."}],
        "estimatedTimeline": "...",
        "estimatedCost": "..."
      },
      "risks": ["...", "..."]
    }
  ]
}`;

    const scoreResponse = await callClaude(scorePrompt, { maxTokens: 8000 });
    const scoreMatch = scoreResponse.match(/\{[\s\S]*\}/);
    if (!scoreMatch) throw new Error('Pass 2: Claude не вернул JSON');

    const scored = JSON.parse(scoreMatch[0]).scored || [];

    // ═══ Phase 4: Filter, dedup, save ═════════════════════════════════
    updateJob(jobId, { status: 'saving', progress: 'Фильтрую и сохраняю...' });

    const db = new Database(DB_PATH);
    const insert = db.prepare(`
      INSERT INTO ideas (title, description, source, source_url, category,
        score_market, score_automation, score_pain_level, score_competition,
        score_willingness_to_pay, score_margin, score_build, score_timing,
        score_composite, verdict, verdict_reason, status, business_plan,
        score_reasoning, discovered_at, is_favorite)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    let savedCount = 0;
    let skippedLowScore = 0;
    let skippedDuplicate = 0;
    const savedIdeas: Array<{ id: number; title: string; verdict: string; composite: number }> = [];

    for (const idea of scored) {
      const scores = idea.scores || {};
      const composite = computeComposite(scores);
      const verdict = getVerdict(composite);

      // Filter: only 7+
      if (composite < MIN_SCORE) {
        skippedLowScore++;
        continue;
      }

      // Dedup: skip if similar idea exists
      if (isDuplicate(db, idea.title)) {
        skippedDuplicate++;
        continue;
      }

      const reasoning = {
        ...scores,
        risks: idea.risks || [],
        researchSummary: idea.demand_evidence || '',
      };

      try {
        const result = insert.run(
          idea.title,
          idea.description,
          'idea-hunt',
          '',
          direction || 'general',
          scores.market?.value || 0,
          scores.automation?.value || 0,
          scores.pain?.value || 0,
          scores.competition?.value || 0,
          scores.willingnessToPay?.value || 0,
          scores.margin?.value || 0,
          scores.build?.value || 0,
          scores.timing?.value || 0,
          composite,
          verdict,
          idea.monetization || '',
          'scored',
          JSON.stringify(idea.business_plan || {}),
          JSON.stringify(reasoning),
          new Date().toISOString()
        );
        savedCount++;
        savedIdeas.push({
          id: Number(result.lastInsertRowid),
          title: idea.title,
          verdict,
          composite,
        });
      } catch {
        skippedDuplicate++;
      }
    }

    // Log the run in daily_runs
    const today = new Date().toISOString().split('T')[0];
    try {
      db.prepare(`
        INSERT OR REPLACE INTO daily_runs (run_date, source, items_found, items_passed_filter, items_scored)
        VALUES (?, 'idea-hunt', ?, ?, ?)
      `).run(today, totalResults, candidates.length, savedCount);
    } catch { /* ignore */ }

    db.close();

    // ═══ Phase 5: Notify ══════════════════════════════════════════════
    if (savedIdeas.length > 0) {
      await sendTelegramNotification(savedIdeas);
    }

    // Complete
    updateJob(jobId, {
      status: 'complete',
      progress: `Готово: ${savedCount} сохранено, ${skippedLowScore} < ${MIN_SCORE}, ${skippedDuplicate} дубликатов`,
      ideas_created: savedCount,
      result: JSON.stringify({
        totalSearchResults: totalResults,
        candidatesExtracted: candidates.length,
        scoredAboveThreshold: scored.filter((s: any) => computeComposite(s.scores || {}) >= MIN_SCORE).length,
        skippedLowScore,
        skippedDuplicate,
        ideasSaved: savedCount,
        ideas: savedIdeas,
      }),
      completed_at: new Date().toISOString(),
    });
  } catch (err) {
    updateJob(jobId, {
      status: 'error',
      error: err instanceof Error ? err.message : String(err),
      completed_at: new Date().toISOString(),
    });
  }
}
