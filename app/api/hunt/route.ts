import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';
import { runHuntJob } from '@/lib/jobs/hunt-job';

const DB_PATH = path.join(process.cwd(), 'data', 'ideas.db');

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
  }
  if (!process.env.FIRECRAWL_API_KEY) {
    return NextResponse.json({ error: 'FIRECRAWL_API_KEY not set' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const direction = body.direction || '';
  const jobId = crypto.randomUUID();

  const db = new Database(DB_PATH);
  db.prepare(
    'INSERT INTO jobs (id, type, status, input, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(jobId, 'idea-hunt', 'pending', JSON.stringify({ direction }), new Date().toISOString());
  db.close();

  // Fire and forget — don't await
  runHuntJob(jobId, direction || undefined).catch(() => {});

  return NextResponse.json({ jobId }, { status: 202 });
}
