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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);

  try {
    const db = new Database(DB_PATH, { readonly: true });
    const r = db.prepare('SELECT * FROM ideas WHERE id = ?').get(numId) as Record<string, unknown> | undefined;
    db.close();
    if (r) return NextResponse.json(mapRow(r));
  } catch {
    // fall through to mock
  }

  const mockIdea = mockIdeas.find(i => i.id === numId);
  if (mockIdea) return NextResponse.json(mockIdea);

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  const body = await request.json();

  try {
    const db = new Database(DB_PATH);

    if ('isFavorite' in body) {
      db.prepare('UPDATE ideas SET is_favorite = ? WHERE id = ?').run(body.isFavorite ? 1 : 0, numId);
    }

    if ('deleted' in body) {
      if (body.deleted) {
        db.prepare('UPDATE ideas SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), numId);
      } else {
        db.prepare('UPDATE ideas SET deleted_at = NULL WHERE id = ?').run(numId);
      }
    }

    const r = db.prepare('SELECT * FROM ideas WHERE id = ?').get(numId) as Record<string, unknown>;
    db.close();
    return NextResponse.json(mapRow(r));
  } catch (e) {
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
    db.prepare('DELETE FROM ideas WHERE id = ?').run(numId);
    db.close();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
