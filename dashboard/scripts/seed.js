import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, "../../data/ideas.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Create tables from init-db.sql schema
db.exec(`
  CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    source TEXT NOT NULL,
    source_url TEXT,
    source_score INTEGER DEFAULT 0,
    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    keywords_matched TEXT,
    category TEXT,
    score_market REAL,
    score_automation REAL,
    score_pain_level REAL,
    score_competition REAL,
    score_willingness_to_pay REAL,
    score_margin REAL,
    score_build REAL,
    score_timing REAL,
    score_composite REAL,
    verdict TEXT,
    verdict_reason TEXT,
    status TEXT DEFAULT 'raw',
    business_plan TEXT,
    notes TEXT,
    scored_at DATETIME,
    title_hash TEXT,
    UNIQUE(source, source_url)
  );

  CREATE TABLE IF NOT EXISTS daily_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_date DATE NOT NULL,
    source TEXT NOT NULL,
    items_found INTEGER DEFAULT 0,
    items_passed_filter INTEGER DEFAULT 0,
    items_scored INTEGER DEFAULT 0,
    errors TEXT,
    duration_seconds REAL,
    UNIQUE(run_date, source)
  );

  CREATE TABLE IF NOT EXISTS cost_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    service TEXT NOT NULL,
    model TEXT,
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    cost_usd REAL DEFAULT 0,
    workflow TEXT
  );

  CREATE TABLE IF NOT EXISTS trend_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL,
    source TEXT NOT NULL,
    signal_type TEXT,
    value REAL,
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    related_ideas TEXT
  );

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

  INSERT OR IGNORE INTO user_stats (id, xp, streak_current, streak_best, total_reviewed, total_approved, total_rejected)
  VALUES (1, 340, 7, 12, 143, 34, 109);
`);

// Seed ideas
const sources = ["google", "hackernews", "reddit", "youtube", "github", "devto", "producthunt", "techcrunch"];
const categories = ["developer-tools", "productivity", "marketing-automation", "sales-tools", "analytics", "ai-ml", "no-code", "fintech"];

const ideas = [
  { title: "AI Resume Parser & Optimizer", desc: "AI-powered resume parser that extracts skills, matches to job descriptions, and suggests improvements automatically", source: "hackernews", score: 142, cat: "ai-ml", m: 8, a: 9, p: 8, co: 7, w: 8, ma: 9, b: 8, t: 9, verdict: "BUILD" },
  { title: "Email Warm-up SaaS for Cold Outreach", desc: "Gradually warms up new email accounts to improve deliverability for sales teams doing cold outreach", source: "reddit", score: 87, cat: "sales-tools", m: 7, a: 8, p: 8, co: 6, w: 7, ma: 8, b: 7, t: 7, verdict: "BET" },
  { title: "Invoice Parser API", desc: "REST API that extracts structured data from invoice PDFs using OCR and AI classification", source: "github", score: 34, cat: "developer-tools", m: 6, a: 9, p: 7, co: 6, w: 7, ma: 8, b: 8, t: 6, verdict: "BET" },
  { title: "Automated SEO Audit Tool", desc: "SaaS that continuously monitors website SEO health, detects issues, and suggests fixes automatically", source: "producthunt", score: 156, cat: "marketing-automation", m: 8, a: 7, p: 7, co: 4, w: 7, ma: 7, b: 6, t: 6, verdict: "BET" },
  { title: "AI Meeting Notes Summarizer", desc: "Records meetings, transcribes, and creates structured summaries with action items", source: "youtube", score: 45000, cat: "productivity", m: 9, a: 8, p: 9, co: 3, w: 8, ma: 8, b: 6, t: 7, verdict: "BET" },
  { title: "Micro-SaaS Boilerplate Generator", desc: "CLI tool that scaffolds complete SaaS apps with auth, billing, dashboard from templates", source: "hackernews", score: 234, cat: "developer-tools", m: 6, a: 9, p: 7, co: 5, w: 6, ma: 9, b: 9, t: 8, verdict: "BET" },
  { title: "AI Customer Support Bot Builder", desc: "No-code platform to build AI support bots trained on your docs, FAQ, and ticket history", source: "producthunt", score: 312, cat: "ai-ml", m: 9, a: 7, p: 8, co: 3, w: 8, ma: 7, b: 5, t: 8, verdict: "BET" },
  { title: "Automated Social Media Scheduler with AI Copywriting", desc: "Schedules posts across platforms with AI-generated captions optimized for engagement", source: "reddit", score: 67, cat: "marketing-automation", m: 8, a: 8, p: 7, co: 3, w: 7, ma: 7, b: 6, t: 6, verdict: "FLIP" },
  { title: "Personal Finance API Aggregator", desc: "Unified API to connect bank accounts, categorize transactions, track budgets across institutions", source: "devto", score: 23, cat: "fintech", m: 7, a: 6, p: 7, co: 4, w: 6, ma: 6, b: 4, t: 5, verdict: "FLIP" },
  { title: "Voice-to-CRM Data Entry", desc: "Sales reps dictate notes after calls and AI structures them into CRM fields automatically", source: "reddit", score: 45, cat: "sales-tools", m: 7, a: 8, p: 8, co: 5, w: 7, ma: 8, b: 6, t: 7, verdict: "BET" },
  { title: "AI Code Review Bot for GitHub", desc: "GitHub app that reviews PRs, suggests improvements, catches bugs using LLM analysis", source: "github", score: 89, cat: "developer-tools", m: 8, a: 9, p: 7, co: 3, w: 7, ma: 8, b: 7, t: 8, verdict: "BET" },
  { title: "Competitor Price Monitoring SaaS", desc: "Tracks competitor pricing changes across websites and alerts when prices change", source: "google", score: 0, cat: "analytics", m: 7, a: 8, p: 6, co: 5, w: 7, ma: 8, b: 7, t: 6, verdict: "BET" },
  { title: "AI-Powered Job Description Writer", desc: "Generates inclusive, optimized job descriptions from basic role requirements", source: "producthunt", score: 78, cat: "ai-ml", m: 6, a: 9, p: 6, co: 5, w: 5, ma: 9, b: 9, t: 7, verdict: "BET" },
  { title: "Subscription Analytics Dashboard", desc: "Connects to Stripe/Paddle and shows MRR, churn, LTV, cohort analysis in real-time", source: "hackernews", score: 167, cat: "analytics", m: 7, a: 8, p: 7, co: 4, w: 7, ma: 8, b: 7, t: 6, verdict: "BET" },
  { title: "Automated Bug Report Classifier", desc: "ML model that auto-categorizes, prioritizes, and routes bug reports from various sources", source: "devto", score: 15, cat: "developer-tools", m: 5, a: 8, p: 6, co: 6, w: 5, ma: 8, b: 7, t: 5, verdict: "FLIP" },
  { title: "No-Code Internal Tools Builder", desc: "Build CRUD apps, dashboards, and admin panels by connecting to databases without code", source: "producthunt", score: 289, cat: "no-code", m: 9, a: 6, p: 8, co: 2, w: 8, ma: 6, b: 4, t: 5, verdict: "FLIP" },
  { title: "AI-Generated Product Descriptions for E-commerce", desc: "Batch generate SEO-optimized product descriptions from images and basic specs", source: "reddit", score: 34, cat: "ai-ml", m: 7, a: 9, p: 6, co: 4, w: 6, ma: 9, b: 8, t: 6, verdict: "BET" },
  { title: "Webhook Relay Service", desc: "Reliable webhook forwarding with retries, logging, and transformation for developers", source: "hackernews", score: 56, cat: "developer-tools", m: 5, a: 9, p: 5, co: 6, w: 5, ma: 9, b: 9, t: 5, verdict: "FLIP" },
  { title: "Simple Time Tracking CLI", desc: "Command-line time tracker with automatic project detection and reporting", source: "github", score: 12, cat: "productivity", m: 4, a: 9, p: 4, co: 7, w: 3, ma: 9, b: 9, t: 4, verdict: "FLIP" },
  { title: "Another CRM for Small Teams", desc: "Yet another CRM solution targeting small businesses with basic contact management", source: "google", score: 0, cat: "sales-tools", m: 3, a: 5, p: 3, co: 2, w: 3, ma: 5, b: 5, t: 3, verdict: "KILL" },
  { title: "Blockchain-Based File Storage", desc: "Decentralized file storage using blockchain for data integrity verification", source: "hackernews", score: 8, cat: "developer-tools", m: 3, a: 4, p: 2, co: 3, w: 2, ma: 4, b: 3, t: 2, verdict: "KILL" },
  { title: "AI Podcast Transcription Service", desc: "Transcribes podcasts with speaker diarization, chapters, and show notes generation", source: "youtube", score: 23000, cat: "ai-ml", m: 7, a: 9, p: 7, co: 3, w: 6, ma: 8, b: 8, t: 6, verdict: "BET" },
  { title: "Smart Contract Audit Tool", desc: "Automated security scanning for Solidity smart contracts using static analysis", source: "github", score: 45, cat: "developer-tools", m: 5, a: 7, p: 5, co: 4, w: 5, ma: 7, b: 5, t: 4, verdict: "FLIP" },
  { title: "AI Writing Assistant for Technical Docs", desc: "Helps developers write clear API docs, READMEs, and changelogs from code", source: "devto", score: 31, cat: "developer-tools", m: 7, a: 9, p: 7, co: 4, w: 6, ma: 9, b: 8, t: 7, verdict: "BET" },
  { title: "Automated A/B Testing Platform", desc: "Set up and analyze A/B tests without developers, with automatic statistical significance detection", source: "producthunt", score: 198, cat: "analytics", m: 8, a: 7, p: 7, co: 3, w: 7, ma: 7, b: 5, t: 6, verdict: "FLIP" },
  { title: "Restaurant Menu QR Code Generator", desc: "Creates digital menus accessible via QR codes for restaurants", source: "google", score: 0, cat: "no-code", m: 4, a: 8, p: 4, co: 2, w: 3, ma: 7, b: 9, t: 2, verdict: "KILL" },
  { title: "Email Template Marketplace", desc: "Buy and sell responsive email templates with drag-and-drop customization", source: "reddit", score: 19, cat: "marketing-automation", m: 5, a: 7, p: 4, co: 3, w: 4, ma: 6, b: 7, t: 3, verdict: "KILL" },
  { title: "API Uptime Monitoring with AI Anomaly Detection", desc: "Monitors API endpoints and uses ML to detect anomalies before they become outages", source: "hackernews", score: 123, cat: "developer-tools", m: 8, a: 9, p: 8, co: 4, w: 8, ma: 8, b: 7, t: 8, verdict: "BUILD" },
  { title: "Freelancer Invoice & Payment Platform", desc: "All-in-one invoicing, time tracking, and payment processing for freelancers", source: "reddit", score: 56, cat: "fintech", m: 7, a: 7, p: 7, co: 3, w: 7, ma: 6, b: 5, t: 5, verdict: "FLIP" },
  { title: "AI-Powered Changelog Generator", desc: "Generates user-facing changelogs from git commits and PR descriptions automatically", source: "github", score: 67, cat: "developer-tools", m: 5, a: 9, p: 6, co: 5, w: 5, ma: 9, b: 9, t: 7, verdict: "BET" },
];

const insertIdea = db.prepare(`
  INSERT OR IGNORE INTO ideas (
    title, description, source, source_url, source_score, discovered_at,
    keywords_matched, category,
    score_market, score_automation, score_pain_level, score_competition,
    score_willingness_to_pay, score_margin, score_build, score_timing,
    score_composite, verdict, verdict_reason, status, scored_at
  ) VALUES (?, ?, ?, ?, ?, datetime('now', ?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scored', datetime('now'))
`);

const reasons = [
  "Strong automation potential, high margin SaaS with clear pain point",
  "Growing market with room for differentiation, good recurring potential",
  "Validated demand from community engagement, feasible MVP",
  "Interesting niche but competitive landscape is challenging",
  "Low market size and saturated space, not worth the effort",
  "Good timing with AI trends, but execution complexity is high",
  "Clear pain point from user feedback, straightforward to build",
  "Niche opportunity with strong willingness to pay",
];

db.transaction(() => {
  ideas.forEach((idea, i) => {
    const weights = { m: 0.15, a: 0.20, p: 0.15, co: 0.10, w: 0.10, ma: 0.10, b: 0.10, t: 0.10 };
    const composite = +(idea.m * weights.m + idea.a * weights.a + idea.p * weights.p +
      idea.co * weights.co + idea.w * weights.w + idea.ma * weights.ma +
      idea.b * weights.b + idea.t * weights.t).toFixed(2);

    const keywords = JSON.stringify(
      [idea.cat, ...idea.title.toLowerCase().split(" ").slice(0, 2)]
    );

    insertIdea.run(
      idea.title, idea.desc, idea.source,
      `https://example.com/${idea.source}/${i}`,
      idea.score,
      `-${Math.floor(Math.random() * 72)}hours`,
      keywords, idea.cat,
      idea.m, idea.a, idea.p, idea.co, idea.w, idea.ma, idea.b, idea.t,
      composite, idea.verdict,
      reasons[i % reasons.length],
    );
  });
})();

// Seed daily runs for today
const today = new Date().toISOString().split("T")[0];
const insertRun = db.prepare(`
  INSERT OR IGNORE INTO daily_runs (run_date, source, items_found, items_passed_filter, items_scored, duration_seconds)
  VALUES (?, ?, ?, ?, ?, ?)
`);

db.transaction(() => {
  insertRun.run(today, "google", 12, 5, 5, 34.2);
  insertRun.run(today, "hackernews", 8, 4, 4, 12.5);
  insertRun.run(today, "reddit", 14, 9, 9, 28.7);
})();

// Seed trend signals
const insertTrend = db.prepare(`
  INSERT INTO trend_signals (keyword, source, signal_type, value, detected_at)
  VALUES (?, ?, ?, ?, datetime('now', ?))
`);

db.transaction(() => {
  insertTrend.run("ai-agent", "hackernews", "rising", 78, "-2hours");
  insertTrend.run("automation", "reddit", "rising", 65, "-3hours");
  insertTrend.run("email-warmup", "google", "rising", 52, "-5hours");
  insertTrend.run("resume-ai", "producthunt", "breakout", 94, "-1hours");
  insertTrend.run("voice-clone", "youtube", "breakout", 88, "-4hours");
  insertTrend.run("saas-boilerplate", "github", "sustained", 71, "-6hours");
  insertTrend.run("no-code", "reddit", "sustained", 63, "-8hours");
})();

// Seed cost log
const insertCost = db.prepare(`
  INSERT INTO cost_log (timestamp, service, model, tokens_input, tokens_output, cost_usd, workflow)
  VALUES (datetime('now', ?), 'claude_api', 'claude-haiku-4-5-20251001', ?, ?, ?, 'idea-scorer')
`);

db.transaction(() => {
  for (let i = 0; i < 10; i++) {
    insertCost.run(`-${i}days`, 2500 + Math.random() * 1000, 800 + Math.random() * 400, 0.05 + Math.random() * 0.08);
  }
})();

// Seed some activity
const insertActivity = db.prepare(`
  INSERT INTO activity_log (action, idea_id, xp_earned, created_at)
  VALUES (?, ?, ?, datetime('now', ?))
`);

db.transaction(() => {
  insertActivity.run("login", null, 10, "-0hours");
  insertActivity.run("view", 1, 5, "-0hours");
  insertActivity.run("approve", 1, 25, "-0hours");
  insertActivity.run("view", 2, 5, "-1hours");
  insertActivity.run("view", 3, 5, "-1hours");
  insertActivity.run("reject", 20, 10, "-2hours");
  insertActivity.run("login", null, 10, "-24hours");
  insertActivity.run("view", 4, 5, "-25hours");
})();

// Seed today's quests
const insertQuest = db.prepare(`
  INSERT OR IGNORE INTO quest_progress (id, quest_type, quest_date, progress, target, completed, xp_reward)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

db.transaction(() => {
  insertQuest.run("patrol", "daily", today, 3, 5, 0, 20);
  insertQuest.run("quick_draw", "daily", today, 7, 10, 0, 30);
  insertQuest.run("radar_check", "daily", today, 0, 1, 0, 10);
  insertQuest.run("first_colony", "epic", "epic", 0, 1, 0, 200);
  insertQuest.run("thousand_ideas", "epic", "epic", 143, 1000, 0, 300);
})();

// Seed some achievements
db.prepare(`INSERT OR IGNORE INTO achievements (id, unlocked_at, notified) VALUES ('first_blood', datetime('now', '-7days'), 1)`).run();
db.prepare(`INSERT OR IGNORE INTO achievements (id, unlocked_at, notified) VALUES ('streak_3', datetime('now', '-4days'), 1)`).run();
db.prepare(`INSERT OR IGNORE INTO achievements (id, unlocked_at, notified) VALUES ('streak_7', datetime('now', '-0days'), 1)`).run();
db.prepare(`INSERT OR IGNORE INTO achievements (id, unlocked_at, notified) VALUES ('speed_runner', datetime('now', '-2days'), 1)`).run();

console.log("✅ Seed complete!");
console.log(`   Ideas: ${db.prepare("SELECT COUNT(*) as c FROM ideas").get().c}`);
console.log(`   Daily runs: ${db.prepare("SELECT COUNT(*) as c FROM daily_runs").get().c}`);
console.log(`   Trend signals: ${db.prepare("SELECT COUNT(*) as c FROM trend_signals").get().c}`);
console.log(`   Activities: ${db.prepare("SELECT COUNT(*) as c FROM activity_log").get().c}`);
console.log(`   Quests: ${db.prepare("SELECT COUNT(*) as c FROM quest_progress").get().c}`);
console.log(`   Achievements: ${db.prepare("SELECT COUNT(*) as c FROM achievements").get().c}`);

db.close();
