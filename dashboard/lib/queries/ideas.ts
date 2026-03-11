import { getDb } from "@/lib/db";
import type { Idea, IdeaFilters } from "@/types/idea";

export function getIdeas(filters: IdeaFilters = {}): Idea[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.verdict) {
    conditions.push("verdict = ?");
    params.push(filters.verdict);
  }
  if (filters.source) {
    conditions.push("source = ?");
    params.push(filters.source);
  }
  if (filters.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  } else {
    // Default: only show scored ideas
    conditions.push("status IN ('scored', 'validated', 'rejected')");
  }
  if (filters.minScore != null) {
    conditions.push("score_composite >= ?");
    params.push(filters.minScore);
  }
  if (filters.maxScore != null) {
    conditions.push("score_composite <= ?");
    params.push(filters.maxScore);
  }
  if (filters.keyword) {
    conditions.push("(keywords_matched LIKE ? OR title LIKE ? OR description LIKE ?)");
    const kw = `%${filters.keyword}%`;
    params.push(kw, kw, kw);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  const sql = `
    SELECT * FROM ideas
    ${where}
    ORDER BY score_composite DESC
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);

  return db.prepare(sql).all(...params) as Idea[];
}

export function getIdeaById(id: number): Idea | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM ideas WHERE id = ?").get(id) as Idea | undefined;
}

export function getVerdictCounts(): Record<string, number> {
  const db = getDb();
  const rows = db.prepare(`
    SELECT verdict, COUNT(*) as count
    FROM ideas
    WHERE score_composite IS NOT NULL AND status IN ('scored', 'validated', 'rejected')
    GROUP BY verdict
  `).all() as Array<{ verdict: string; count: number }>;

  const counts: Record<string, number> = { BUILD: 0, BET: 0, FLIP: 0, KILL: 0, ALL: 0 };
  for (const row of rows) {
    counts[row.verdict] = row.count;
    counts.ALL += row.count;
  }
  return counts;
}

export function updateIdeaStatus(id: number, status: string): void {
  const db = getDb();
  db.prepare("UPDATE ideas SET status = ? WHERE id = ?").run(status, id);
}

export function getPendingCount(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as count FROM ideas WHERE status = 'scored'").get() as { count: number };
  return row.count;
}

export function getTotalIdeasCount(): number {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) as count FROM ideas").get() as { count: number };
  return row.count;
}

export function getTopIdeas(limit: number = 5): Idea[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM ideas
    WHERE status = 'scored' AND verdict IN ('BUILD', 'BET')
    ORDER BY score_composite DESC
    LIMIT ?
  `).all(limit) as Idea[];
}
