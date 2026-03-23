#!/usr/bin/env node

/**
 * Daily Idea Hunt — запускать через cron/Task Scheduler
 *
 * Cron (Linux):    0 6 * * * cd /path/to/autonomy && node scripts/daily-hunt.mjs
 * Task Scheduler:  Run at 06:00 daily → node C:\path\to\autonomy\scripts\daily-hunt.mjs
 *
 * Запускается в 06:00, к 09:00 результаты будут на платформе.
 * Идеи ниже 7.0 автоматически отсеиваются.
 */

import Database from 'better-sqlite3';
import https from 'https';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

dotenv.config({ path: path.join(ROOT, '.env') });

const DB_PATH = path.join(ROOT, 'data', 'ideas.db');
const MIN_SCORE = 7.0;

// ── Firecrawl search ───────────────────────────────────────────────────
function firecrawlSearch(query, limit = 5) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) return reject(new Error('FIRECRAWL_API_KEY not set'));

    const body = JSON.stringify({ query, limit, scrapeOptions: { formats: ['markdown'] } });
    const req = https.request({
      hostname: 'api.firecrawl.dev', path: '/v1/search', method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode !== 200) return reject(new Error(`Firecrawl ${res.statusCode}: ${raw.slice(0, 200)}`));
        try {
          const data = JSON.parse(raw).data || [];
          resolve(data.map(item => ({
            url: item.url || '', title: item.title || '', markdown: item.markdown || '',
          })));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Claude call ────────────────────────────────────────────────────────
function callClaude(prompt, maxTokens = 4000) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001', max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    const req = https.request({
      hostname: 'api.anthropic.com', path: '/v1/messages', method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      },
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const d = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode !== 200) return reject(new Error(`Claude ${res.statusCode}: ${d.slice(0, 200)}`));
        try { resolve(JSON.parse(d).content[0].text.trim()); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Telegram ───────────────────────────────────────────────────────────
function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return Promise.resolve();

  return new Promise(resolve => {
    const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', disable_web_page_preview: true });
    const req = https.request({
      hostname: 'api.telegram.org', path: `/bot${token}/sendMessage`, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, () => resolve());
    req.on('error', () => resolve());
    req.write(body);
    req.end();
  });
}

// ── Safe JSON parse (handles bad escapes from LLM) ─────────────────
function safeJsonParse(raw) {
  try { return JSON.parse(raw); } catch {}
  // Fix common LLM JSON issues: unescaped control chars, bad escapes
  const cleaned = raw
    .replace(/[\x00-\x1F\x7F]/g, ' ')           // remove control chars
    .replace(/\\'/g, "'")                          // \' → '
    .replace(/\\([^"\\\/bfnrtu])/g, '$1');         // bad escapes → literal
  try { return JSON.parse(cleaned); } catch {}
  // Last resort: extract arrays/objects more aggressively
  try { return JSON.parse(cleaned.replace(/,\s*([}\]])/g, '$1')); } catch (e) {
    throw new Error(`JSON parse failed: ${e.message}\nRaw (first 500): ${raw.slice(0, 500)}`);
  }
}

// ── Scoring ────────────────────────────────────────────────────────────
const WEIGHTS = { market: 0.15, automation: 0.15, pain: 0.20, competition: 0.10, willingnessToPay: 0.15, margin: 0.10, build: 0.08, timing: 0.07 };

function computeComposite(scores) {
  let c = 0;
  for (const [k, w] of Object.entries(WEIGHTS)) c += (scores[k]?.value ?? 0) * w;
  return Math.round(c * 10) / 10;
}

function getVerdict(score) {
  if (score >= 7.5) return 'BUILD';
  if (score >= 6.0) return 'BET';
  if (score >= 4.0) return 'FLIP';
  return 'KILL';
}

function isDuplicate(db, title) {
  const words = title.toLowerCase().replace(/[^a-zа-яё0-9\s]/gi, '').split(/\s+/).filter(w => w.length > 3);
  if (!words.length) return false;
  const existing = db.prepare('SELECT title FROM ideas WHERE deleted_at IS NULL').all();
  for (const row of existing) {
    const ew = row.title.toLowerCase().replace(/[^a-zа-яё0-9\s]/gi, '').split(/\s+/).filter(w => w.length > 3);
    if (!ew.length) continue;
    const overlap = words.filter(w => ew.includes(w)).length;
    if (overlap / Math.min(words.length, ew.length) >= 0.6) return true;
  }
  return false;
}

// ── Main ───────────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Daily Idea Hunt started`);

  // Check keys
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');
  if (!process.env.FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY not set');

  // Create job record
  const db = new Database(DB_PATH);
  const jobId = crypto.randomUUID();
  db.prepare('INSERT INTO jobs (id, type, status, input, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(jobId, 'idea-hunt', 'searching', '{"source":"daily-cron"}', new Date().toISOString());
  db.close();

  // ── Phase 1: Search ──────────────────────────────────────────────
  console.log('Phase 1: Searching...');
  const queries = [
    'site:reddit.com "I would pay for" OR "someone should build" 2025 2026',
    'site:reddit.com r/SideProject OR r/indiehackers "revenue" OR "MRR" making money 2025',
    'site:reddit.com "micro saas" OR "built in a weekend" revenue 2025',
    'best online business ideas 2025 2026 low cost high profit',
    'AI business ideas 2025 startup low budget automation agent',
    'telegram bot business revenue 2025 mini app',
    'site:producthunt.com launched 2025 trending SaaS',
    'site:youtube.com "micro saas" OR "side project" revenue 2025',
    'profitable side project 2025 solo founder bootstrap',
  ];

  let allContent = '';
  let totalResults = 0;

  // Batch 3 at a time
  for (let i = 0; i < queries.length; i += 3) {
    const batch = queries.slice(i, i + 3);
    const results = await Promise.allSettled(batch.map(q => firecrawlSearch(q, 5)));

    for (let j = 0; j < batch.length; j++) {
      const r = results[j];
      if (r.status === 'fulfilled' && r.value.length > 0) {
        allContent += `\n--- ${batch[j]} ---\n`;
        for (const item of r.value) {
          allContent += `URL: ${item.url}\nTitle: ${item.title}\n${item.markdown?.slice(0, 1500) || ''}\n\n`;
          totalResults++;
        }
      }
    }
  }

  console.log(`  Found ${totalResults} results`);

  // ── Phase 2: Extract candidates ──────────────────────────────────
  console.log('Phase 2: Extracting candidates...');

  const extractPrompt = `Ты — скаут стартап-акселератора. Из собранных данных извлеки ВСЕ потенциальные бизнес-идеи.

ДАННЫЕ:
${allContent.slice(0, 30000)}

ПРАВИЛА:
- Извлеки 5-10 идей из данных. НЕ выдумывай — только из данных.
- Укажи ОТКУДА каждая идея (URL, цитата)
- MVP до $100, подтверждённый спрос, путь к монетизации

JSON:
{"candidates":[{"title":"Название на русском","description":"2-3 предложения","source_evidence":"Цитата/ссылка","competitors":"Конкуренты","monetization":"Модель"}]}`;

  const extractResp = await callClaude(extractPrompt);
  const extractMatch = extractResp.match(/\{[\s\S]*\}/);
  if (!extractMatch) throw new Error('Pass 1 failed');
  const candidates = safeJsonParse(extractMatch[0]).candidates || [];
  console.log(`  Extracted ${candidates.length} candidates`);

  if (candidates.length === 0) {
    const dbEnd = new Database(DB_PATH);
    dbEnd.prepare('UPDATE jobs SET status = ?, progress = ?, completed_at = ? WHERE id = ?')
      .run('complete', 'Нет кандидатов', new Date().toISOString(), jobId);
    dbEnd.close();
    console.log('No candidates found. Done.');
    return;
  }

  // ── Phase 3: Strict scoring ──────────────────────────────────────
  console.log('Phase 3: Strict scoring...');

  // Only score top 5 candidates to save tokens
  const topCandidates = candidates.slice(0, 5);

  const scorePrompt = `Строгий инвестиционный аналитик. Оцени ${topCandidates.length} идей ЧЕСТНО.

КАНДИДАТЫ:
${topCandidates.map((c, i) => `${i + 1}. "${c.title}" — ${c.description}\n   Спрос: ${c.source_evidence}\n   Конкуренты: ${c.competitors}`).join('\n\n')}

ПРАВИЛА: НЕ ставь 8+ без цифр. Сомневаешься → НИЖЕ. 70% micro-SaaS < $1K MRR.

Критерии (0-10): market, automation, pain, competition, willingnessToPay, margin, build, timing.
Причины (reason) — КОРОТКО, 5-10 слов.
features — максимум 4. launchSteps — максимум 3.

ТОЛЬКО JSON:
{"scored":[{"title":"...","description":"1 предложение","format":"...","demand_evidence":"кратко","competitors":"кратко","monetization":"кратко","launch_cost":"$X","potential_mrr":"$X","scores":{"market":{"value":7,"reason":"кратко"},"automation":{"value":8,"reason":"кратко"},"pain":{"value":7,"reason":"кратко"},"competition":{"value":6,"reason":"кратко"},"willingnessToPay":{"value":5,"reason":"кратко"},"margin":{"value":8,"reason":"кратко"},"build":{"value":8,"reason":"кратко"},"timing":{"value":7,"reason":"кратко"}},"business_plan":{"problem":"1 предложение","valueProposition":"1 предложение","targetAudience":"кратко","features":["max 4"],"techStack":["max 3"],"pricing":"кратко","launchSteps":[{"step":1,"title":"...","description":"кратко"}],"estimatedTimeline":"...","estimatedCost":"..."},"risks":["max 2"]}]}`;

  const scoreResp = await callClaude(scorePrompt, 16000);
  const scoreMatch = scoreResp.match(/\{[\s\S]*\}/);
  if (!scoreMatch) throw new Error('Pass 2 failed');
  const scored = safeJsonParse(scoreMatch[0]).scored || [];

  // ── Phase 4: Filter + dedup + save ───────────────────────────────
  console.log('Phase 4: Saving...');
  const db2 = new Database(DB_PATH);

  const insert = db2.prepare(`
    INSERT INTO ideas (title, description, source, source_url, category,
      score_market, score_automation, score_pain_level, score_competition,
      score_willingness_to_pay, score_margin, score_build, score_timing,
      score_composite, verdict, verdict_reason, status, business_plan,
      score_reasoning, discovered_at, is_favorite)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `);

  let savedCount = 0, skippedLow = 0, skippedDup = 0;
  const savedIdeas = [];

  for (const idea of scored) {
    const scores = idea.scores || {};
    const composite = computeComposite(scores);
    const verdict = getVerdict(composite);

    if (composite < MIN_SCORE) { skippedLow++; continue; }
    if (isDuplicate(db2, idea.title)) { skippedDup++; continue; }

    const reasoning = { ...scores, risks: idea.risks || [], researchSummary: idea.demand_evidence || '' };

    try {
      const r = insert.run(
        idea.title, idea.description, 'idea-hunt', '', 'general',
        scores.market?.value || 0, scores.automation?.value || 0, scores.pain?.value || 0,
        scores.competition?.value || 0, scores.willingnessToPay?.value || 0,
        scores.margin?.value || 0, scores.build?.value || 0, scores.timing?.value || 0,
        composite, verdict, idea.monetization || '', 'scored',
        JSON.stringify(idea.business_plan || {}), JSON.stringify(reasoning),
        new Date().toISOString()
      );
      savedCount++;
      savedIdeas.push({ id: Number(r.lastInsertRowid), title: idea.title, verdict, composite });
    } catch { skippedDup++; }
  }

  // Log run
  const today = new Date().toISOString().split('T')[0];
  try {
    db2.prepare('INSERT OR REPLACE INTO daily_runs (run_date, source, items_found, items_passed_filter, items_scored) VALUES (?, ?, ?, ?, ?)')
      .run(today, 'idea-hunt', totalResults, candidates.length, savedCount);
  } catch {}

  // Update job
  db2.prepare('UPDATE jobs SET status = ?, progress = ?, ideas_created = ?, result = ?, completed_at = ? WHERE id = ?')
    .run('complete', `${savedCount} сохранено, ${skippedLow} < ${MIN_SCORE}, ${skippedDup} дубликатов`,
      savedCount, JSON.stringify({ totalResults, candidates: candidates.length, saved: savedCount, skippedLow, skippedDup, ideas: savedIdeas }),
      new Date().toISOString(), jobId);

  db2.close();

  // ── Phase 5: Telegram ────────────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);

  if (savedIdeas.length > 0) {
    const lines = savedIdeas.map(i => {
      const e = i.verdict === 'BUILD' ? '🟢' : i.verdict === 'BET' ? '🟡' : '⚪';
      return `${e} *${i.composite.toFixed(1)}* — ${i.title}`;
    }).join('\n');

    await sendTelegram(
      `🔍 *Idea Hunt — ${new Date().toLocaleDateString('ru-RU')}*\n` +
      `Найдено: ${savedIdeas.length} идей (порог ${MIN_SCORE}+)\n\n${lines}\n\n` +
      `⏱ ${elapsed}с | 📊 ${totalResults} источников → ${candidates.length} кандидатов`
    );
  } else {
    await sendTelegram(
      `🔍 *Idea Hunt — ${new Date().toLocaleDateString('ru-RU')}*\n` +
      `Новых идей ${MIN_SCORE}+ не найдено.\n` +
      `${totalResults} источников → ${candidates.length} кандидатов → ${skippedLow} ниже порога, ${skippedDup} дубликатов\n` +
      `⏱ ${elapsed}с`
    );
  }

  console.log(`\nDone in ${elapsed}s:`);
  console.log(`  ${totalResults} search results → ${candidates.length} candidates → ${savedCount} saved`);
  console.log(`  Skipped: ${skippedLow} low score, ${skippedDup} duplicates`);
  savedIdeas.forEach(i => console.log(`  [${i.verdict}] ${i.composite} — ${i.title}`));
}

main().catch(err => {
  console.error('FATAL:', err);
  // Try to notify via Telegram
  sendTelegram(`❌ *Daily Hunt FAILED*\n\`${err.message}\``).finally(() => process.exit(1));
});
