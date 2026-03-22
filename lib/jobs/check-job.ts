import Database from 'better-sqlite3';
import path from 'path';
import { firecrawlBatchSearch } from '@/lib/firecrawl';
import { callClaude, computeComposite, getVerdict } from '@/lib/claude';

const DB_PATH = path.join(process.cwd(), 'data', 'ideas.db');

function updateJob(id: string, fields: Record<string, unknown>) {
  const db = new Database(DB_PATH);
  const sets = Object.keys(fields).map((k) => `${k} = ?`).join(', ');
  db.prepare(`UPDATE jobs SET ${sets} WHERE id = ?`).run(
    ...Object.values(fields),
    id
  );
  db.close();
}

export async function runCheckJob(
  jobId: string,
  title: string,
  description: string,
  ideaId?: number
) {
  try {
    // Phase 1: Quick Check — search for competitors, market, demand
    updateJob(jobId, { status: 'searching', progress: 'Quick Check: ищу конкурентов и спрос...' });

    const quickQueries = [
      `${title} app platform startup competitors`,
      `${title} market size TAM 2024 2025`,
      `site:reddit.com ${title} need solution looking for alternative`,
      `${title} pricing revenue funding startup`,
      `${title} review complaint problem`,
    ];

    const quickResults = await firecrawlBatchSearch(quickQueries, { limit: 5, batchSize: 3 });

    let quickContent = '';
    for (const [query, results] of quickResults) {
      if (results.length > 0) {
        quickContent += `\n--- ${query} ---\n`;
        for (const r of results) {
          quickContent += `URL: ${r.url}\nTitle: ${r.title}\n${r.markdown?.slice(0, 1200) || ''}\n\n`;
        }
      }
    }

    // Phase 2: Decision Gate
    updateJob(jobId, { status: 'analyzing', progress: 'Claude оценивает потенциал...' });

    const gatePrompt = `Ты — аналитик венчурного фонда. Оцени бизнес-идею на основе Quick Check данных.

ИДЕЯ: ${title}
ОПИСАНИЕ: ${description}

ДАННЫЕ QUICK CHECK:
${quickContent.slice(0, 15000)}

Оцени: есть ли смысл делать Deep Dive (глубокий анализ)?

СТОП если:
- 5+ крупных игроков с >$10M финансированием каждый
- Рынок консолидирован (1-2 компании 80%+)
- Нет явного differentiator
- Высокий барьер входа

DEEP DIVE если:
- Рынок фрагментирован и растёт
- Есть неудовлетворённый спрос
- Ниша формируется
- Есть потенциальный differentiator

Ответь JSON:
{"decision": "DEEP_DIVE" или "STOP", "reason": "почему на русском"}`;

    const gateResponse = await callClaude(gatePrompt, { maxTokens: 500 });
    const gateMatch = gateResponse.match(/\{[\s\S]*\}/);
    const gate = gateMatch ? JSON.parse(gateMatch[0]) : { decision: 'DEEP_DIVE' };

    let deepContent = '';

    if (gate.decision === 'DEEP_DIVE') {
      // Phase 3: Deep Dive searches
      updateJob(jobId, { status: 'searching', progress: 'Deep Dive: детальный анализ рынка...' });

      const deepQueries = [
        `"${title}" competitor pricing plans features`,
        `"${title}" alternative better cheaper`,
        `site:reddit.com "${title}" OR "${description.split(' ').slice(0, 3).join(' ')}" review experience`,
        `${title} business model monetization SaaS subscription`,
        `${title} customer acquisition cost marketing strategy`,
        `${title} technical challenge build MVP cost`,
        `${title} market trend growth 2025 2026`,
      ];

      const deepResults = await firecrawlBatchSearch(deepQueries, { limit: 5, batchSize: 3 });

      for (const [query, results] of deepResults) {
        if (results.length > 0) {
          deepContent += `\n--- ${query} ---\n`;
          for (const r of results) {
            deepContent += `URL: ${r.url}\nTitle: ${r.title}\n${r.markdown?.slice(0, 1000) || ''}\n\n`;
          }
        }
      }
    }

    // Phase 4: Full Analysis
    updateJob(jobId, { status: 'analyzing', progress: 'Формирую финальный отчёт...' });

    const analysisPrompt = `Ты — аналитик венчурного фонда. Проведи полную валидацию бизнес-идеи.

ИДЕЯ: ${title}
ОПИСАНИЕ: ${description}

QUICK CHECK ДАННЫЕ:
${quickContent.slice(0, 12000)}

${deepContent ? `DEEP DIVE ДАННЫЕ:\n${deepContent.slice(0, 15000)}` : ''}

GATE DECISION: ${gate.decision} — ${gate.reason}

Ответь ТОЛЬКО JSON (без markdown):
{
  "verdict": "GO" | "CONDITIONAL" | "NO_GO",
  "verdict_summary": "Одно предложение на русском",
  "key_findings": ["Находка 1", "Находка 2", "Находка 3"],
  "market": {
    "tam": "...",
    "sam": "...",
    "som": "...",
    "growth": "..."
  },
  "competitors": [
    {"name": "...", "focus": "...", "pricing": "...", "weakness": "..."}
  ],
  "demand_evidence": ["Цитата/факт 1", "Цитата/факт 2"],
  "monetization": {
    "model": "...",
    "recommended_price": "...",
    "estimated_conversion": "...",
    "mrr_estimate": "..."
  },
  "entry_cost": {
    "development": "...",
    "marketing": "...",
    "timeline": "..."
  },
  "unmet_needs": ["Потребность 1", "Потребность 2"],
  "action_plan": [
    {"month": 1, "actions": ["...", "..."]},
    {"month": 2, "actions": ["...", "..."]},
    {"month": 3, "actions": ["...", "..."]}
  ],
  "scores": {
    "market": {"value": 7, "reason": "..."},
    "automation": {"value": 8, "reason": "..."},
    "pain": {"value": 7, "reason": "..."},
    "competition": {"value": 8, "reason": "..."},
    "willingnessToPay": {"value": 7, "reason": "..."},
    "margin": {"value": 8, "reason": "..."},
    "build": {"value": 8, "reason": "..."},
    "timing": {"value": 7, "reason": "..."}
  },
  "risks": ["Риск 1", "Риск 2", "Риск 3"]
}`;

    const analysisResponse = await callClaude(analysisPrompt, { maxTokens: 6000 });
    const analysisMatch = analysisResponse.match(/\{[\s\S]*\}/);
    if (!analysisMatch) throw new Error('Claude не вернул JSON');

    const analysis = JSON.parse(analysisMatch[0]);

    // Phase 5: Update idea in DB if ideaId provided
    if (ideaId) {
      updateJob(jobId, { status: 'saving', progress: 'Обновляю идею в базе...' });

      const scores = analysis.scores || {};
      const composite = computeComposite(scores);
      const verdict = getVerdict(composite);

      const reasoning = {
        ...scores,
        risks: analysis.risks || [],
        researchSummary: (analysis.demand_evidence || []).join('; '),
      };

      const businessPlan = {
        problem: analysis.unmet_needs?.join('. ') || '',
        valueProposition: analysis.verdict_summary || '',
        targetAudience: analysis.market?.sam || '',
        features: analysis.unmet_needs || [],
        techStack: [],
        pricing: analysis.monetization?.recommended_price || '',
        launchSteps: (analysis.action_plan || []).flatMap(
          (m: { month: number; actions: string[] }) =>
            m.actions.map((a: string, i: number) => ({
              step: (m.month - 1) * 3 + i + 1,
              title: `Месяц ${m.month}`,
              description: a,
            }))
        ),
        estimatedTimeline: analysis.entry_cost?.timeline || '',
        estimatedCost: analysis.entry_cost?.development || '',
      };

      const db = new Database(DB_PATH);
      db.prepare(`
        UPDATE ideas SET
          score_market = ?, score_automation = ?, score_pain_level = ?,
          score_competition = ?, score_willingness_to_pay = ?, score_margin = ?,
          score_build = ?, score_timing = ?, score_composite = ?,
          verdict = ?, verdict_reason = ?, score_reasoning = ?,
          business_plan = ?, status = 'validated'
        WHERE id = ?
      `).run(
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
        analysis.verdict_summary || '',
        JSON.stringify(reasoning),
        JSON.stringify(businessPlan),
        ideaId
      );
      db.close();
    }

    // Complete
    updateJob(jobId, {
      status: 'complete',
      progress: `Готово: вердикт ${analysis.verdict}`,
      ideas_created: ideaId ? 1 : 0,
      result: JSON.stringify(analysis),
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
