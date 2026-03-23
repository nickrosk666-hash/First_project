#!/usr/bin/env node

/**
 * Batch Poller — checks pending batches, saves results to DB
 *
 * Cron: every 10min 4-8h daily
 *
 * Finds jobs with status='batch_pending', checks batch status, saves ideas when done.
 */

import Database from 'better-sqlite3';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env') });

const DB_PATH = path.join(ROOT, 'data', 'ideas.db');
const MIN_SCORE = 7.0;

// ── HTTP helpers ─────────────────────────────────────────────────────
function httpGet(hostname, urlPath, headers) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname, path: urlPath, method: 'GET', headers,
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.end();
  });
}

function httpPost(hostname, urlPath, headers, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = https.request({
      hostname, path: urlPath, method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return Promise.resolve();
  return httpPost('api.telegram.org', `/bot${token}/sendMessage`, {}, {
    chat_id: chatId, text, parse_mode: 'Markdown', disable_web_page_preview: true,
  }).catch(() => {});
}

// ── Scoring helpers ──────────────────────────────────────────────────
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

function safeJsonParse(raw) {
  try { return JSON.parse(raw); } catch {}
  const cleaned = raw.replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\\'/g, "'").replace(/\\([^"\\\/bfnrtu])/g, '$1');
  try { return JSON.parse(cleaned); } catch {}
  try { return JSON.parse(cleaned.replace(/,\s*([}\]])/g, '$1')); } catch (e) {
    throw new Error(`JSON parse: ${e.message}`);
  }
}

// ── Score prompt builder (for fallback) ──────────────────────────────
function buildScorePromptFromCandidates(candidates) {
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
  const db = new Database(DB_PATH);

  // Find pending batch jobs
  const pendingJobs = db.prepare(
    "SELECT id, result FROM jobs WHERE status = 'batch_pending' ORDER BY created_at ASC"
  ).all();

  if (pendingJobs.length === 0) {
    db.close();
    return; // Nothing to poll — silent exit
  }

  const apiHeaders = {
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  };

  for (const job of pendingJobs) {
    let jobData;
    try {
      jobData = JSON.parse(job.result);
    } catch {
      db.prepare('UPDATE jobs SET status = ?, error = ?, completed_at = ? WHERE id = ?')
        .run('error', 'Invalid job data', new Date().toISOString(), job.id);
      continue;
    }

    const { batchId, totalResults, candidates } = jobData;
    console.log(`[${new Date().toISOString()}] Polling batch ${batchId} for job ${job.id}`);

    // Check batch status
    const statusRes = await httpGet('api.anthropic.com', `/v1/messages/batches/${batchId}`, apiHeaders);
    if (statusRes.status !== 200) {
      console.log(`  Status check failed: ${statusRes.status}`);
      continue;
    }

    const batchStatus = JSON.parse(statusRes.body);
    console.log(`  Status: ${batchStatus.processing_status}`);

    if (batchStatus.processing_status !== 'ended') {
      // Not ready yet — will check on next cron run
      console.log('  Not ready yet, will retry later.');
      continue;
    }

    // Batch complete — fetch results
    console.log('  Fetching results...');
    const resultsRes = await httpGet('api.anthropic.com', `/v1/messages/batches/${batchId}/results`, apiHeaders);

    if (resultsRes.status !== 200) {
      db.prepare('UPDATE jobs SET status = ?, error = ?, completed_at = ? WHERE id = ?')
        .run('error', `Results fetch failed: ${resultsRes.status}`, new Date().toISOString(), job.id);
      continue;
    }

    // Results are JSONL — one JSON object per line
    const lines = resultsRes.body.trim().split('\n');
    let scoreText = null;

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.result?.type === 'succeeded') {
          scoreText = entry.result.message.content[0].text.trim();
        } else if (entry.result?.type === 'errored') {
          console.log(`  Request errored: ${JSON.stringify(entry.result.error)}`);
        }
      } catch { /* skip bad lines */ }
    }

    if (!scoreText) {
      // Fallback: retry with regular API (still saves time, just no 50% discount)
      console.log('  Batch failed — falling back to regular API...');
      try {
        const fallbackRes = await httpPost('api.anthropic.com', '/v1/messages', apiHeaders, {
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 16000,
          messages: [{ role: 'user', content: buildScorePromptFromCandidates(candidates) }],
        });
        if (fallbackRes.status === 200) {
          scoreText = JSON.parse(fallbackRes.body).content[0].text.trim();
          console.log('  Fallback succeeded.');
        } else {
          db.prepare('UPDATE jobs SET status = ?, error = ?, completed_at = ? WHERE id = ?')
            .run('error', `Batch and fallback both failed`, new Date().toISOString(), job.id);
          await sendTelegram(`❌ *Batch Hunt*\nBatch ${batchId} и fallback оба упали.`);
          continue;
        }
      } catch (e) {
        db.prepare('UPDATE jobs SET status = ?, error = ?, completed_at = ? WHERE id = ?')
          .run('error', `Fallback error: ${e.message}`, new Date().toISOString(), job.id);
        continue;
      }
    }

    // Parse scored ideas
    const scoreMatch = scoreText.match(/\{[\s\S]*\}/);
    if (!scoreMatch) {
      db.prepare('UPDATE jobs SET status = ?, error = ?, completed_at = ? WHERE id = ?')
        .run('error', 'No JSON in batch result', new Date().toISOString(), job.id);
      continue;
    }

    const scored = safeJsonParse(scoreMatch[0]).scored || [];
    console.log(`  Scored ${scored.length} ideas`);

    // ── Save to DB ─────────────────────────────────────────────────
    const insert = db.prepare(`
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
      if (isDuplicate(db, idea.title)) { skippedDup++; continue; }

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
      db.prepare('INSERT OR REPLACE INTO daily_runs (run_date, source, items_found, items_passed_filter, items_scored) VALUES (?, ?, ?, ?, ?)')
        .run(today, 'idea-hunt-batch', totalResults, candidates.length, savedCount);
    } catch {}

    // Update job
    db.prepare('UPDATE jobs SET status = ?, progress = ?, ideas_created = ?, result = ?, completed_at = ? WHERE id = ?')
      .run('complete',
        `${savedCount} сохранено, ${skippedLow} < ${MIN_SCORE}, ${skippedDup} дубликатов`,
        savedCount,
        JSON.stringify({ batchId, totalResults, candidates: candidates.length, saved: savedCount, skippedLow, skippedDup, ideas: savedIdeas }),
        new Date().toISOString(), job.id);

    // ── Telegram ───────────────────────────────────────────────────
    if (savedIdeas.length > 0) {
      const lines = savedIdeas.map(i => {
        const e = i.verdict === 'BUILD' ? '🟢' : i.verdict === 'BET' ? '🟡' : '⚪';
        return `${e} *${i.composite.toFixed(1)}* — ${i.title}`;
      }).join('\n');

      await sendTelegram(
        `🔍 *Batch Hunt — ${new Date().toLocaleDateString('ru-RU')}*\n` +
        `Найдено: ${savedIdeas.length} идей (порог ${MIN_SCORE}+)\n\n${lines}\n\n` +
        `📊 ${totalResults} источников → ${candidates.length} кандидатов\n` +
        `💰 Batch API (50% дешевле)`
      );
    } else {
      await sendTelegram(
        `🔍 *Batch Hunt — ${new Date().toLocaleDateString('ru-RU')}*\n` +
        `Новых идей ${MIN_SCORE}+ не найдено.\n` +
        `${totalResults} источников → ${candidates.length} кандидатов → ${skippedLow} ниже порога, ${skippedDup} дубликатов\n` +
        `💰 Batch API`
      );
    }

    console.log(`  Saved: ${savedCount}, Low: ${skippedLow}, Dup: ${skippedDup}`);
    savedIdeas.forEach(i => console.log(`    [${i.verdict}] ${i.composite} — ${i.title}`));
  }

  db.close();
}

main().catch(err => {
  console.error('POLLER ERROR:', err);
  sendTelegram(`❌ *Batch Poller FAILED*\n\`${err.message}\``).finally(() => process.exit(1));
});
