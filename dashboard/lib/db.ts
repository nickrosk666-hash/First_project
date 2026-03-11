import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, "../../data/ideas.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    // Ensure gamification tables exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_stats (
        id INTEGER PRIMARY KEY DEFAULT 1,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        streak_current INTEGER DEFAULT 0,
        streak_best INTEGER DEFAULT 0,
        streak_last_date TEXT,
        streak_shield_available INTEGER DEFAULT 1,
        total_reviewed INTEGER DEFAULT 0,
        total_approved INTEGER DEFAULT 0,
        total_rejected INTEGER DEFAULT 0,
        total_launched INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        unlocked_at DATETIME,
        notified INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS quest_progress (
        id TEXT NOT NULL,
        quest_type TEXT NOT NULL,
        quest_date TEXT,
        progress INTEGER DEFAULT 0,
        target INTEGER NOT NULL,
        completed INTEGER DEFAULT 0,
        xp_reward INTEGER NOT NULL,
        PRIMARY KEY (id, quest_date)
      );

      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        idea_id INTEGER,
        xp_earned INTEGER DEFAULT 0,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS idea_notes (
        idea_id INTEGER PRIMARY KEY,
        notes TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      INSERT OR IGNORE INTO user_stats (id) VALUES (1);
    `);
  }
  return db;
}
