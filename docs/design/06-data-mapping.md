# Data-to-UI Mapping

How each database field renders in the UI.
Reference: `scripts/setup/init-db.sql` for schema, `config/scoring-weights.json` for current scoring config.

---

## ideas table → UI

| DB Field | UI Location | Render |
|----------|------------|--------|
| `id` | URL param | `/ideas/{id}` |
| `title` | IdeaCard H3, Detail H1 | `text-h3` / `text-h1`, `text-primary` |
| `description` | IdeaCard body, Detail intro | `text-body`, `text-secondary`, max 2 lines in card (truncate) |
| `source` | IdeaCard top-left dot + name | Colored dot (8px, color from `colors.source[source]`) + name `text-caption` |
| `source_url` | Detail page link | External link icon, opens in new tab |
| `source_score` | IdeaCard meta | `{N} pts` or `{N}★` (for github), `text-secondary` |
| `discovered_at` | IdeaCard meta, Detail meta | Relative time: "2h ago", "3d ago". Use `date-fns/formatDistanceToNow` |
| `keywords_matched` | IdeaCard tags, Detail tags | JSON array → pill badges, `bg-surface2 text-secondary text-badge rounded-pill` |
| `category` | IdeaCard tag (first tag) | Same pill style as keywords, but `#` prefix |
| `score_market` | Detail sub-scores, IdeaCard inline | Progress bar + number. Color: green 7+, yellow 4.5-7, red <4.5 |
| `score_automation` | Same | Same |
| `score_pain_level` | Same | Same — NEW field (was not in original 6-score system) |
| `score_competition` | Same | Same |
| `score_willingness_to_pay` | Same | Same — NEW field |
| `score_margin` | Same | Same |
| `score_build` | Same | Same |
| `score_timing` | Same | Same — NEW field |
| `score_composite` | Score pill (IdeaCard + Detail) | JetBrains Mono, verdict-colored, animated count-up on detail |
| `verdict` | Verdict pill label, tab filter | "BUILD" / "BET" / "FLIP" / "KILL", uppercase, verdict color |
| `verdict_reason` | IdeaCard bottom, Detail quote | `text-body`, `text-secondary`, italic, prefixed "Claude: " |
| `status` | Filter logic, Portfolio | raw/pending_scoring/scored/validated/rejected/building |
| `business_plan` | Detail accordion sections | JSON blob, parsed into Market/Competition/Revenue/Tech/Risk/Launch sections |
| `notes` | — | Deprecated, use `idea_notes.notes` instead |

### Score field names mapping (DB → UI label)

Current scoring config has 8 criteria:

| DB field | UI Label (short) | UI Label (full) | Weight |
|----------|-----------------|-----------------|--------|
| `score_market` | Market | Market Size | 0.15 |
| `score_automation` | Auto | Automation Feasibility | 0.20 |
| `score_pain_level` | Pain | Pain Level | 0.15 |
| `score_competition` | Comp | Competition | 0.10 |
| `score_willingness_to_pay` | WTP | Willingness to Pay | 0.10 |
| `score_margin` | Margin | Margin Potential | 0.10 |
| `score_build` | Build | Build Complexity | 0.10 |
| `score_timing` | Timing | Timing | 0.10 |

> Note: the DB schema in `init-db.sql` may still have old 6-field names.
> Dashboard should read whatever fields exist and gracefully handle missing ones.
> The source of truth for field names and weights is `config/scoring-weights.json`.

### Verdict thresholds (from scoring-weights.json)

| Verdict | Range | Color | Glow |
|---------|-------|-------|------|
| BUILD | 8.0+ | `#22C55E` | gold border glow |
| BET | 6.5 – 8.0 | `#EAB308` | none |
| FLIP | 4.5 – 6.5 | `#F97316` | none, card dimmed |
| KILL | < 4.5 | `#EF4444` | none, card very dimmed |

---

## daily_runs table → UI

| DB Field | UI Location | Render |
|----------|------------|--------|
| `run_date` | Pipeline Health | Filter by today |
| `source` | Pipeline Health dots | Source name + status icon |
| `items_found` | Pipeline Health stats | "Found: {N}" |
| `items_passed_filter` | Pipeline Health stats | "Filtered: {N}" |
| `items_scored` | Pipeline Health stats | "Scored: {N}" |
| `errors` | Pipeline Health | If not null: red icon + count |

Status per source:
- Row exists + items_scored > 0 → ✅ (green dot, completed)
- Row exists + items_scored = 0 + no errors → ⏳ (yellow dot, running/pending)
- Row exists + errors not null → ❌ (red dot, error)
- No row for today → 🔲 (muted dot, not started)

---

## cost_log table → UI

| DB Field | UI Location | Render |
|----------|------------|--------|
| `timestamp` | Trends Budget chart x-axis | Group by date |
| `cost_usd` | Budget card, Trends Budget | Sum per month |
| `model` | — | Not shown, but can be used for tooltip detail |
| `tokens_input/output` | — | Not shown in v1, potential detail view |

Budget display:
- Current month total vs $3.00 limit (from KPI in 00-vision.md)
- Progress bar color: green (<$1.80), yellow ($1.80-$2.40), red (>$2.40)
- Sidebar: "$0.74" next to DollarSign icon, same color logic

---

## trend_signals table → UI

| DB Field | UI Location | Render |
|----------|------------|--------|
| `keyword` | Trends Keyword section | Clickable pill tag |
| `source` | — | Could show as secondary info |
| `signal_type` | Keyword pill style | `rising`: blue pill, `breakout`: purple pill + pulse, `sustained`: orange pill |
| `value` | Keyword pill size/sort | Higher value = listed first |
| `detected_at` | Sort order | Most recent first |
| `related_ideas` | Click action | JSON array of idea IDs → filter ideas by keyword |

---

## user_stats table → UI

| DB Field | UI Location | Render |
|----------|------------|--------|
| `xp` | Sidebar XPBar, Stats page | JetBrains Mono, gradient fill bar |
| `level` | Sidebar LevelBadge, Stats | Ring badge + title |
| `streak_current` | Sidebar StreakFlame | Flame icon + number |
| `streak_best` | Stats page | "Best: {N} days" |
| `total_reviewed` | Stats page | Number |
| `total_approved` | Stats page | Number |
| `total_rejected` | Stats page | Number |
| `total_launched` | Stats page, StatCard | Number |

---

## activity_log table → UI

| DB Field | UI Location | Render |
|----------|------------|--------|
| `action` | Activity Timeline, quest progress | Icon per action type |
| `idea_id` | Activity Timeline link | Click → `/ideas/{id}` |
| `xp_earned` | Activity Timeline | "+{N} XP" in accent blue |
| `created_at` | Activity Timeline | Time format: "14:32" for today, "Mar 8" for older |

Action icons:
| action | Icon | Label |
|--------|------|-------|
| `login` | `LogIn` | "Logged in" |
| `view` | `Eye` | "Viewed {title}" |
| `approve` | `Check` | "Approved {title}" |
| `reject` | `X` | "Rejected {title}" |
| `launch` | `Rocket` | "Launched {title}" |
| `visit_trends` | `TrendingUp` | "Checked Trends" |

---

## Source display names and icons

| source value (DB) | Display name | Lucide icon | Color dot |
|-------------------|-------------|-------------|-----------|
| `google` | Google News | `Globe` | `#4285F4` |
| `hackernews` | HackerNews | `Hash` | `#FF6600` |
| `reddit` | Reddit | `MessageCircle` | `#FF4500` |
| `youtube` | YouTube | `Play` | `#FF0000` |
| `github` | GitHub | `Github` | `#E6E6E6` |
| `devto` | Dev.to | `Code` | `#3B49DF` |
| `producthunt` | ProductHunt | `Rocket` | `#DA552F` |
| `news` | TechCrunch | `Newspaper` | `#0A9B2C` |

Engagement label by source:
| source | `source_score` label |
|--------|---------------------|
| `hackernews` | "{N} pts" |
| `reddit` | "{N} upvotes" |
| `youtube` | "{N} views" |
| `github` | "{N}★" |
| `producthunt` | "{N} votes" |
| `devto` | "{N} reactions" |
| `google`, `news` | — (no engagement metric) |
