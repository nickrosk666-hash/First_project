import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'ideas.db');

export async function GET() {
  try {
    const db = new Database(DB_PATH, { readonly: true });

    // Get last 30 hunt jobs
    const jobs = db.prepare(`
      SELECT id, status, progress, ideas_created, result, error, created_at, completed_at
      FROM jobs
      WHERE type = 'idea-hunt'
      ORDER BY created_at DESC
      LIMIT 30
    `).all() as Record<string, unknown>[];

    // Get daily_runs stats
    const runs = db.prepare(`
      SELECT run_date, items_found, items_passed_filter, items_scored
      FROM daily_runs
      WHERE source = 'idea-hunt'
      ORDER BY run_date DESC
      LIMIT 30
    `).all();

    // Next scheduled run info
    const lastRun = jobs[0];
    const lastRunDate = lastRun?.created_at ? new Date(lastRun.created_at as string) : null;

    db.close();

    return NextResponse.json({
      jobs: jobs.map(j => ({
        ...j,
        result: j.result ? JSON.parse(j.result as string) : null,
      })),
      runs,
      lastRunDate: lastRunDate?.toISOString() || null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
