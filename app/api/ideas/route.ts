import { NextResponse } from 'next/server';
import { mockIdeas } from '@/lib/mock-data';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'ideas.db');

function mapRow(r: Record<string, unknown>) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    source: r.source,
    sourceUrl: r.source_url,
    scoreComposite: r.score_composite,
    verdict: r.verdict,
    verdictReason: r.verdict_reason,
    status: r.status,
    discoveredAt: r.discovered_at,
    isFavorite: Boolean(r.is_favorite),
    deletedAt: r.deleted_at ?? null,
    scores: {
      market: r.score_market,
      automation: r.score_automation,
      pain: r.score_pain_level,
      competition: r.score_competition,
      willingnessToPay: r.score_willingness_to_pay,
      margin: r.score_margin,
      build: r.score_build,
      timing: r.score_timing,
    },
    detail: r.business_plan ? (() => { try { return JSON.parse(r.business_plan as string); } catch { return null; } })() : null,
    scoreReasoning: r.score_reasoning ? (() => { try { return JSON.parse(r.score_reasoning as string); } catch { return null; } })() : null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'favorites' | 'deleted' | null (active)

  // Auto-purge ideas deleted more than 7 days ago
  try {
    const db = new Database(DB_PATH);
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('DELETE FROM ideas WHERE deleted_at IS NOT NULL AND deleted_at < ?').run(cutoff);
    db.close();
  } catch { /* ignore */ }

  try {
    const db = new Database(DB_PATH, { readonly: true });

    let rows: Record<string, unknown>[];
    if (type === 'favorites') {
      rows = db.prepare('SELECT * FROM ideas WHERE is_favorite = 1 AND deleted_at IS NULL ORDER BY score_composite DESC').all() as Record<string, unknown>[];
    } else if (type === 'deleted') {
      rows = db.prepare('SELECT * FROM ideas WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC').all() as Record<string, unknown>[];
    } else {
      rows = db.prepare('SELECT * FROM ideas WHERE deleted_at IS NULL ORDER BY score_composite DESC').all() as Record<string, unknown>[];
    }
    db.close();

    return NextResponse.json({ ideas: rows.map(mapRow), source: 'live' });
  } catch {
    return NextResponse.json({ ideas: mockIdeas, source: 'mock' });
  }
}
