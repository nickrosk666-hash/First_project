import { NextResponse } from 'next/server';
import { MOCK_IDEAS } from '@/lib/mock-data';

// Path to n8n SQLite database
const DB_PATH = process.env.N8N_DB_PATH || 'C:/AI Cloude/Projects/autonomy/data/n8n/autonomy-ideas.sqlite';

async function getIdeasFromDB() {
  try {
    // Dynamic import to avoid build errors if better-sqlite3 native module not available
    const Database = (await import('better-sqlite3')).default;
    const db = new Database(DB_PATH, { readonly: true });

    const rows = db.prepare(`
      SELECT
        id, title, description, source, source_url as sourceUrl,
        score_composite as scoreComposite, verdict, verdict_reason as verdictReason,
        status, discovered_at as discoveredAt,
        score_market as market, score_automation as automation,
        score_pain as pain, score_competition as competition,
        score_willingness_to_pay as willingnessToPay,
        score_margin as margin, score_build as build, score_timing as timing
      FROM ideas
      ORDER BY discovered_at DESC
      LIMIT 100
    `).all();

    db.close();

    return rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      title: row.title,
      description: row.description || row.verdictReason || '',
      source: row.source,
      sourceUrl: row.sourceUrl || '',
      scoreComposite: row.scoreComposite,
      verdict: row.verdict,
      verdictReason: row.verdictReason || '',
      status: row.status || 'new',
      discoveredAt: row.discoveredAt,
      scores: {
        market: row.market,
        automation: row.automation,
        pain: row.pain,
        competition: row.competition,
        willingnessToPay: row.willingnessToPay,
        margin: row.margin,
        build: row.build,
        timing: row.timing,
      },
    }));
  } catch {
    // DB not available yet — return null to fall back to mock data
    return null;
  }
}

export async function GET() {
  const dbIdeas = await getIdeasFromDB();

  if (dbIdeas && dbIdeas.length > 0) {
    return NextResponse.json({ ideas: dbIdeas, source: 'database' });
  }

  // Fallback to mock data while n8n is not running
  return NextResponse.json({ ideas: MOCK_IDEAS, source: 'mock' });
}
