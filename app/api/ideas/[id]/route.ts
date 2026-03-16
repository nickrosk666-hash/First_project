import { NextResponse } from 'next/server';
import { MOCK_IDEAS } from '@/lib/mock-data';

const DB_PATH = process.env.N8N_DB_PATH || 'C:/AI Cloude/Projects/autonomy/data/n8n/autonomy-ideas.sqlite';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);

  try {
    const Database = (await import('better-sqlite3')).default;
    const db = new Database(DB_PATH, { readonly: true });

    const row = db.prepare(`
      SELECT * FROM ideas WHERE id = ?
    `).get(numId) as Record<string, unknown> | undefined;

    db.close();

    if (row) {
      return NextResponse.json({
        id: row.id,
        title: row.title,
        description: row.verdict_reason || '',
        source: row.source,
        sourceUrl: row.source_url || '',
        scoreComposite: row.score_composite,
        verdict: row.verdict,
        verdictReason: row.verdict_reason || '',
        status: row.status || 'new',
        discoveredAt: row.discovered_at,
        scores: {
          market: row.score_market,
          automation: row.score_automation,
          pain: row.score_pain,
          competition: row.score_competition,
          willingnessToPay: row.score_willingness_to_pay,
          margin: row.score_margin,
          build: row.score_build,
          timing: row.score_timing,
        },
      });
    }
  } catch {
    // fall through to mock
  }

  const mockIdea = MOCK_IDEAS.find(i => i.id === numId);
  if (mockIdea) return NextResponse.json(mockIdea);

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
