-- Autonomy: схема базы данных
-- Запуск: sqlite3 data/ideas.db < scripts/setup/init-db.sql

CREATE TABLE IF NOT EXISTS ideas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    source TEXT NOT NULL,              -- google, hackernews, reddit, youtube, github, devto, news, producthunt
    source_url TEXT,
    source_score INTEGER DEFAULT 0,    -- upvotes/stars/votes из источника
    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    keywords_matched TEXT,             -- JSON array: ["launched", "saas"]
    category TEXT,                     -- developer-tools, productivity, ai-ml...

    -- Claude scoring (NULL до оценки) — 8 критериев
    score_market REAL,                -- Размер рынка (вес 0.15)
    score_automation REAL,            -- Автономность (вес 0.20)
    score_pain REAL,                  -- Острота боли (вес 0.15)
    score_competition REAL,           -- Конкуренция (вес 0.10)
    score_willingness_to_pay REAL,    -- Готовность платить (вес 0.10)
    score_margin REAL,                -- Маржинальность (вес 0.10)
    score_build REAL,                 -- Сложность MVP (вес 0.10)
    score_timing REAL,                -- Тайминг входа (вес 0.10)
    score_composite REAL,
    verdict TEXT,                       -- BUILD, BET, FLIP, KILL
    verdict_reason TEXT,               -- Одна строка от Claude

    status TEXT DEFAULT 'raw',         -- raw → pending_scoring → scored → validated → rejected → building
    notes TEXT,
    scored_at DATETIME,

    -- Дедупликация
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
    service TEXT NOT NULL,              -- claude_api
    model TEXT,                         -- claude-haiku-4-5-20251001
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    cost_usd REAL DEFAULT 0,
    workflow TEXT                       -- idea-scorer, validator, etc.
);

CREATE TABLE IF NOT EXISTS trend_signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL,
    source TEXT NOT NULL,
    signal_type TEXT,                   -- rising, breakout, sustained
    value REAL,                         -- trend score / search volume
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    related_ideas TEXT                  -- JSON array of idea IDs
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_ideas_composite ON ideas(score_composite DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_discovered ON ideas(discovered_at);
CREATE INDEX IF NOT EXISTS idx_ideas_verdict ON ideas(verdict);
CREATE INDEX IF NOT EXISTS idx_ideas_source ON ideas(source);
CREATE INDEX IF NOT EXISTS idx_daily_runs_date ON daily_runs(run_date);
CREATE INDEX IF NOT EXISTS idx_cost_log_timestamp ON cost_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_trend_signals_keyword ON trend_signals(keyword);

-- Полезные views
CREATE VIEW IF NOT EXISTS v_top_ideas AS
SELECT id, title, source, score_composite, verdict, verdict_reason, discovered_at
FROM ideas
WHERE status = 'scored' AND verdict IN ('BUILD', 'BET')
ORDER BY score_composite DESC;

CREATE VIEW IF NOT EXISTS v_monthly_costs AS
SELECT
    strftime('%Y-%m', timestamp) AS month,
    SUM(tokens_input) AS total_input_tokens,
    SUM(tokens_output) AS total_output_tokens,
    ROUND(SUM(cost_usd), 4) AS total_cost_usd
FROM cost_log
GROUP BY strftime('%Y-%m', timestamp)
ORDER BY month DESC;

CREATE VIEW IF NOT EXISTS v_daily_stats AS
SELECT
    run_date,
    SUM(items_found) AS total_found,
    SUM(items_passed_filter) AS total_filtered,
    SUM(items_scored) AS total_scored,
    GROUP_CONCAT(source) AS sources_run
FROM daily_runs
GROUP BY run_date
ORDER BY run_date DESC;
