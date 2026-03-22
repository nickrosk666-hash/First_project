import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'ideas.db');

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const db = new Database(DB_PATH, { readonly: true });
    const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    db.close();

    if (!row) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: row.id,
      type: row.type,
      status: row.status,
      progress: row.progress,
      result: row.result ? JSON.parse(row.result as string) : null,
      error: row.error,
      ideasCreated: row.ideas_created,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
