import { getDb } from "@/lib/db";
import type { UserStats, Achievement, QuestProgress, ActivityEntry } from "@/types/gamification";

export function getUserStats(): UserStats {
  const db = getDb();
  return db.prepare("SELECT * FROM user_stats WHERE id = 1").get() as UserStats;
}

export function addXP(amount: number): UserStats {
  const db = getDb();
  db.prepare("UPDATE user_stats SET xp = xp + ? WHERE id = 1").run(amount);
  return getUserStats();
}

export function getAchievements(): Achievement[] {
  const db = getDb();
  return db.prepare("SELECT * FROM achievements ORDER BY unlocked_at DESC").all() as Achievement[];
}

export function unlockAchievement(id: string): void {
  const db = getDb();
  db.prepare(`
    INSERT OR IGNORE INTO achievements (id, unlocked_at, notified)
    VALUES (?, datetime('now'), 0)
  `).run(id);
}

export function getQuestsForToday(): QuestProgress[] {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  return db.prepare(`
    SELECT * FROM quest_progress
    WHERE (quest_type = 'daily' AND quest_date = ?)
       OR (quest_type = 'weekly')
       OR (quest_type = 'epic')
    ORDER BY quest_type, id
  `).all(today) as QuestProgress[];
}

export function logActivity(action: string, ideaId: number | null, xpEarned: number): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO activity_log (action, idea_id, xp_earned, created_at)
    VALUES (?, ?, ?, datetime('now'))
  `).run(action, ideaId, xpEarned);
}

export function getRecentActivity(limit: number = 10): ActivityEntry[] {
  const db = getDb();
  return db.prepare(`
    SELECT a.*, i.title as idea_title
    FROM activity_log a
    LEFT JOIN ideas i ON a.idea_id = i.id
    ORDER BY a.created_at DESC
    LIMIT ?
  `).all(limit) as ActivityEntry[];
}

export function updateStreak(): { streak: number; shieldUsed: boolean } {
  const db = getDb();
  const stats = getUserStats();
  const today = new Date().toISOString().split("T")[0];

  if (stats.streak_last_date === today) {
    return { streak: stats.streak_current, shieldUsed: false };
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const dayBefore = new Date(Date.now() - 172800000).toISOString().split("T")[0];

  let newStreak = stats.streak_current;
  let shieldUsed = false;

  if (stats.streak_last_date === yesterday) {
    newStreak += 1;
  } else if (stats.streak_shield_available && stats.streak_last_date === dayBefore) {
    newStreak += 1;
    shieldUsed = true;
    db.prepare("UPDATE user_stats SET streak_shield_available = 0 WHERE id = 1").run();
  } else {
    newStreak = 1;
  }

  const bestStreak = Math.max(newStreak, stats.streak_best);
  db.prepare(`
    UPDATE user_stats
    SET streak_current = ?, streak_best = ?, streak_last_date = ?
    WHERE id = 1
  `).run(newStreak, bestStreak, today);

  return { streak: newStreak, shieldUsed };
}

export function getBudgetUsed(): number {
  const db = getDb();
  const month = new Date().toISOString().slice(0, 7);
  try {
    const row = db.prepare(`
      SELECT COALESCE(SUM(cost_usd), 0) as total
      FROM cost_log
      WHERE strftime('%Y-%m', timestamp) = ?
    `).get(month) as { total: number };
    return row.total;
  } catch {
    return 0;
  }
}

export function getDailyRunsToday() {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  try {
    return db.prepare("SELECT * FROM daily_runs WHERE run_date = ?").all(today);
  } catch {
    return [];
  }
}
