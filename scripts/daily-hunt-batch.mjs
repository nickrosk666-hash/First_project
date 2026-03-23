#!/usr/bin/env node

/**
 * Daily Idea Hunt — Batch API version (50% cheaper)
 *
 * Two-phase process:
 *   1. daily-hunt-batch.mjs  — Firecrawl search + submit Claude Batch → saves batch_id to DB
 *   2. batch-poller.mjs      — polls batch status → saves ideas → sends Telegram
 *
 * Cron:
 *   0 4 * * * cd /opt/autonomy && node scripts/daily-hunt-batch.mjs >> /var/log/autonomy-hunt.log 2>&1
 *   every 10min 5-8h: cd /opt/autonomy && node scripts/batch-poller.mjs >> /var/log/autonomy-hunt.log 2>&1
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

// ── HTTP helper ──────────────────────────────────────────────────────
function httpPost(hostname, urlPath, headers, body) {
  return new Promise((resolve, reject) => {
    const data = typeof body === 'string' ? body : JSON.stringify(body);
    const req = https.request({
      hostname, path: urlPath, method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, body: raw });
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ── Firecrawl search ─────────────────────────────────────────────────
async function firecrawlSearch(query, limit = 5) {
  const res = await httpPost('api.firecrawl.dev', '/v1/search', {
    Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
  }, { query, limit, scrapeOptions: { formats: ['markdown'] } });

  if (res.status !== 200) throw new Error(`Firecrawl ${res.status}: ${res.body.slice(0, 200)}`);
  return (JSON.parse(res.body).data || []).map(item => ({
    url: item.url || '', title: item.title || '', markdown: item.markdown || '',
  }));
}

// ── Telegram ─────────────────────────────────────────────────────────
function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return Promise.resolve();
  return httpPost('api.telegram.org', `/bot${token}/sendMessage`, {}, {
    chat_id: chatId, text, parse_mode: 'Markdown', disable_web_page_preview: true,
  }).catch(() => {});
}

// ── Build prompts ────────────────────────────────────────────────────
function buildExtractPrompt(content) {
  return `Ты — скаут стартап-акселератора. Из собранных данных извлеки ВСЕ потенциальные бизнес-идеи.

ДАННЫЕ:
${content.slice(0, 30000)}

ПРАВИЛА:
- Извлеки 5-10 идей из данных. НЕ выдумывай — только из данных.
- Укажи ОТКУДА каждая идея (URL, цитата)
- MVP до $100, подтверждённый спрос, путь к монетизации

JSON:
{"candidates":[{"title":"Название на русском","description":"2-3 предложения","source_evidence":"Цитата/ссылка","competitors":"Конкуренты","monetization":"Модель"}]}`;
}

function buildScorePrompt(candidates) {
  const top = candidates.slice(0, 5);
  return `Строгий инвестиционный аналитик. Оцени ${top.length} идей ЧЕСТНО.

КАНДИДАТЫ:
${top.map((c, i) => `${i + 1}. "${c.title}" — ${c.description}\n   Спрос: ${c.source_evidence}\n   Конкуренты: ${c.competitors}`).join('\n\n')}

ПРАВИЛА: НЕ ставь 8+ без цифр. Сомневаешься → НИЖЕ. 70% micro-SaaS < $1K MRR.

Критерии (0-10): market, automation, pain, competition, willingnessToPay, margin, build, timing.
Причины (reason) — КОРОТКО, 5-10 слов.
features — максимум 4. launchSteps — максимум 3.

ТОЛЬКО JSON:
{"scored":[{"title":"...","description":"1 предложение","format":"...","demand_evidence":"кратко","competitors":"кратко","monetization":"кратко","launch_cost":"$X","potential_mrr":"$X","scores":{"market":{"value":7,"reason":"кратко"},"automation":{"value":8,"reason":"кратко"},"pain":{"value":7,"reason":"кратко"},"competition":{"value":6,"reason":"кратко"},"willingnessToPay":{"value":5,"reason":"кратко"},"margin":{"value":8,"reason":"кратко"},"build":{"value":8,"reason":"кратко"},"timing":{"value":7,"reason":"кратко"}},"business_plan":{"problem":"1 предложение","valueProposition":"1 предложение","targetAudience":"кратко","features":["max 4"],"techStack":["max 3"],"pricing":"кратко","launchSteps":[{"step":1,"title":"...","description":"кратко"}],"estimatedTimeline":"...","estimatedCost":"..."},"risks":["max 2"]}]}`;
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  console.log(`\n[${new Date().toISOString()}] Batch Hunt — Phase 1: Search & Submit`);

  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');
  if (!process.env.FIRECRAWL_API_KEY) throw new Error('FIRECRAWL_API_KEY not set');

  // Create job
  const db = new Database(DB_PATH);
  const jobId = crypto.randomUUID();
  db.prepare('INSERT INTO jobs (id, type, status, input, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(jobId, 'idea-hunt-batch', 'searching', '{"source":"daily-batch"}', new Date().toISOString());
  db.close();

  // ── Search ─────────────────────────────────────────────────────────
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
  if (totalResults === 0) {
    const db2 = new Database(DB_PATH);
    db2.prepare('UPDATE jobs SET status = ?, progress = ?, completed_at = ? WHERE id = ?')
      .run('complete', 'No search results', new Date().toISOString(), jobId);
    db2.close();
    await sendTelegram(`🔍 *Batch Hunt*\nНичего не найдено в поиске (0 результатов).`);
    return;
  }

  // ── Submit Batch with both requests ────────────────────────────────
  console.log('  Submitting batch to Claude...');

  const extractPrompt = buildExtractPrompt(allContent);

  // We submit extract request first; scoring will be done by poller after extract completes
  // Actually, Batch API processes all requests independently — we can't chain them.
  // So we do: submit extract as batch → poller gets result → submits score as batch → poller saves.
  // But that's 2 rounds. Simpler: do extract synchronously (it's cheap), then batch only scoring.

  // Actually, let's batch BOTH as separate requests and handle in poller.
  // The poller will: get extract result → build score prompt → but wait, score depends on extract.
  // So the cleanest approach: extract is synchronous (fast, ~$0.002), score is batch (50% off).

  // Synchronous extract (cheap, ~4K tokens)
  const extractRes = await httpPost('api.anthropic.com', '/v1/messages', {
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  }, {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [{ role: 'user', content: extractPrompt }],
  });

  if (extractRes.status !== 200) throw new Error(`Extract failed: ${extractRes.body.slice(0, 300)}`);

  const extractText = JSON.parse(extractRes.body).content[0].text.trim();
  const extractMatch = extractText.match(/\{[\s\S]*\}/);
  if (!extractMatch) throw new Error('Extract: no JSON');

  let candidates;
  try {
    candidates = safeJsonParse(extractMatch[0]).candidates || [];
  } catch (e) {
    throw new Error(`Extract JSON failed: ${e.message}`);
  }

  console.log(`  Extracted ${candidates.length} candidates`);
  if (candidates.length === 0) {
    const db2 = new Database(DB_PATH);
    db2.prepare('UPDATE jobs SET status = ?, progress = ?, completed_at = ? WHERE id = ?')
      .run('complete', 'No candidates', new Date().toISOString(), jobId);
    db2.close();
    await sendTelegram(`🔍 *Batch Hunt*\n${totalResults} источников, но кандидатов не найдено.`);
    return;
  }

  // Submit scoring as Batch API (50% discount)
  const scorePrompt = buildScorePrompt(candidates);

  const batchRes = await httpPost('api.anthropic.com', '/v1/messages/batches', {
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  }, {
    requests: [{
      custom_id: `hunt-score-${jobId}`,
      params: {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 16000,
        messages: [{ role: 'user', content: scorePrompt }],
      },
    }],
  });

  if (batchRes.status !== 200) throw new Error(`Batch create failed: ${batchRes.body.slice(0, 300)}`);

  const batchData = JSON.parse(batchRes.body);
  const batchId = batchData.id;
  console.log(`  Batch submitted: ${batchId}`);

  // Save batch_id and candidates to job for poller
  const db3 = new Database(DB_PATH);
  db3.prepare('UPDATE jobs SET status = ?, progress = ?, result = ? WHERE id = ?')
    .run('batch_pending', `Batch ${batchId} отправлен`, JSON.stringify({
      batchId,
      totalResults,
      candidates,
    }), jobId);
  db3.close();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`  Done in ${elapsed}s. Batch ID: ${batchId}`);
  console.log('  Poller will check for results and save ideas.');

  await sendTelegram(
    `🔍 *Batch Hunt отправлен*\n` +
    `${totalResults} источников → ${candidates.length} кандидатов\n` +
    `Batch: \`${batchId}\`\n` +
    `Результаты скоринга придут через 15-60 мин (50% дешевле)`
  );
}

// ── Safe JSON parse ──────────────────────────────────────────────────
function safeJsonParse(raw) {
  try { return JSON.parse(raw); } catch {}
  const cleaned = raw
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .replace(/\\'/g, "'")
    .replace(/\\([^"\\\/bfnrtu])/g, '$1');
  try { return JSON.parse(cleaned); } catch {}
  try { return JSON.parse(cleaned.replace(/,\s*([}\]])/g, '$1')); } catch (e) {
    throw new Error(`JSON parse failed: ${e.message}\nRaw (first 500): ${raw.slice(0, 500)}`);
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  sendTelegram(`❌ *Batch Hunt FAILED*\n\`${err.message}\``).finally(() => process.exit(1));
});
