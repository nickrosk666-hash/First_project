# Page Layouts Specification

Reference: `01-design-tokens.json` for values, `02-components.md` for component specs.

---

## Global Shell

Every page shares the same shell: sidebar + topbar + content area.

### Sidebar (left)

```
Width: 240px expanded, 64px collapsed (icons only)
Background: #0A0A0B
Border-right: 1px solid #2A2A2D
Collapse: button toggle or auto at <1024px viewport
```

Contents top-to-bottom:
1. **Logo**: "AUTONOMY" text, 14px bold, tracking 0.05em
2. **Player card** (12px gap from logo):
   - LevelBadge (40px) + "Lv{N} {Title}" text
   - XPBar below: 4px height, full width
   - StreakFlame + day count
3. **Nav items** (24px gap from player card):
   - Command Center → icon: `Home`
   - Discoveries → icon: `Zap`, badge: unreviewed count (blue pill)
   - Trends → icon: `TrendingUp`
   - Colonies → icon: `Castle`
   - Achievements → icon: `Trophy`
4. **Divider**: 1px line `#2A2A2D`, 16px vertical margin
5. **Bottom nav**:
   - Settings → icon: `Settings`
   - Budget → icon: `DollarSign`, live cost text, color by threshold

Nav item styles:
```css
/* Default */
color: #71717A;
padding: 8px 12px;
border-radius: 8px;
gap: 10px; /* icon to text */

/* Hover */
color: #A1A1AA;
background: #141415;

/* Active */
color: #ECECEC;
background: #1C1C1E;
border-left: 2px solid #3B82F6;
/* left border replaces 2px of left padding to prevent layout shift */
```

### TopBar (top)

```
Height: 56px
Background: #0A0A0B
Border-bottom: 1px solid #2A2A2D
Padding: 0 32px
Display: flex, align-center, justify-between
```

- Left: H1 page title (28px Inter semibold, #ECECEC)
- Left (on nested pages): breadcrumb `← {parent} / {current}` — "←" is a ghost link
- Right: Search trigger (ghost button, "⌘K" label) + NotificationBell

### NotificationBell
- Icon: `Bell` (lucide), 20px
- Badge: small red dot (8px) or count pill if >0
- Pulsing animation if there are BUILD-verdict ideas discovered since last visit
- Click: dropdown with last 5 notifications

### Content Area
- Takes remaining width after sidebar
- Padding: 32px (desktop), 24px (mobile)
- Max-width: 1200px, centered on very wide screens
- Scroll: vertical only, smooth

---

## Page 1: Command Center (`/`)

Purpose: at-a-glance empire status. See what's new, what to do, how you're growing.

### Layout (bento grid, 12 columns)

**Row 1: Stat Cards** (4 cards, each span 3)
| Card | Value source | Delta | Sparkline |
|------|-------------|-------|-----------|
| Ideas Found | `SELECT COUNT(*) FROM ideas` | vs yesterday | 7-day daily count |
| Pending Review | `SELECT COUNT(*) FROM ideas WHERE status='scored'` | pulse if >20 | — |
| Colonies | `SELECT COUNT(*) FROM ideas WHERE status IN ('building','launched')` | — | — |
| Budget | `SELECT SUM(cost_usd) FROM cost_log WHERE month=current` | "of $3.00" | 7-day daily spend |

Gap below: 24px

**Row 2: Quests + Empire** (2 panels)
- Daily Quests panel: span 7
  - H2: "Daily Quests"
  - 3-5 QuestCard components stacked vertically, gap 8px
  - Source: `quest_progress WHERE quest_type='daily' AND quest_date=today`
- Your Empire panel: span 5
  - StreakFlame (large) + milestone text
  - LevelBadge (large) + level title
  - XPBar
  - Last 3 unlocked achievements (mini badge icons + names)
  - Source: `user_stats`, `achievements ORDER BY unlocked_at DESC LIMIT 3`

Gap below: 24px

**Row 3: Hot Discoveries** (span 12)
- H2: "Hot Discoveries"
- Horizontal scrollable row of 3-5 compact IdeaCards (condensed variant)
- Source: `SELECT * FROM ideas WHERE status='scored' AND verdict IN ('BUILD','BET') ORDER BY score_composite DESC LIMIT 5`
- Each card: source dot, title, score pill, engagement, [Review →] button
- BUILD cards get gold glow border

Gap below: 24px

**Row 4: Pipeline Health** (span 12)
- H2: "Pipeline Health"
- Today's source status: colored dots per source from `daily_runs WHERE run_date=today`
  - ✅ completed (green) / ⏳ running (yellow pulse) / 🔲 pending (muted) / ❌ error (red)
- Stats line: "Found: {N} → Filtered: {N} → Scored: {N} · Errors: {N}"
- Compact: single card, 1-2 lines of content

Gap below: 24px

**Row 5: Recent Activity** (span 12)
- H2: "Recent Activity"
- List of last 10 entries from `activity_log`
- Each row: timestamp (14:32), action icon, description, XP earned
- Compact: 32px row height, no cards, just rows with subtle bottom borders

---

## Page 2: Discoveries (`/ideas`)

Purpose: browse, filter, and act on business ideas. The core daily interaction.

### Layout

**Banner** (conditional, top):
- Shows only if unreviewed ideas exist since last visit
- Text: "⚡ {N} new discoveries since your last patrol"
- Background: `accent.blue` at 5% opacity, border `accent.blue` at 20%
- Dismiss: click X or auto-hide after viewing

**Verdict Tabs** (below banner):
- `[All {count}] [BUILD {count}] [BET {count}] [FLIP {count}] [KILL {count}]`
- See VerdictTabs component spec

**Filter Bar** (below tabs, gap 12px):
- Source dropdown: "Source: [All ▾]" — options show colored dot + source name
- Score slider: dual-thumb range, 0-10, labels at each end
- Sort dropdown: "Sort: [Score ▾]" — options: Score (desc), Date (desc), Source
- Layout: flex row, gap 12px, wrap on mobile

**Idea List** (below filters, gap 12px):
- Full-width IdeaCard components, stacked vertically
- Infinite scroll (load 20 at a time)
- Empty state per filter: "No {verdict} discoveries found" + reset filters link

**Keyboard Hint Bar** (fixed bottom, subtle):
- Ghost key pills: `J` ↓  `K` ↑  `A` approve  `R` reject  `Enter` detail  `F` focus
- Background: transparent, text `#71717A`, 11px
- Only visible on desktop, hide on mobile

### Focus Mode (F key toggle)
- Hides: sidebar, topbar, filters, keyboard hints
- Shows: only idea cards, full-width, larger
- Exit: press F again or Esc

### Data queries
```sql
-- Main feed
SELECT * FROM ideas
WHERE status = ? AND source = ? AND score_composite BETWEEN ? AND ?
ORDER BY score_composite DESC
LIMIT 20 OFFSET ?;

-- Counts for tabs
SELECT verdict, COUNT(*) FROM ideas WHERE score_composite IS NOT NULL GROUP BY verdict;
```

---

## Page 3: Idea Detail (`/ideas/[id]`)

Purpose: full business plan for one idea. Make the approve/reject/launch decision.

### Layout (single column, max-width 800px centered)

**Breadcrumb**: `← Discoveries / {idea.title}`

**Meta line**: source dot + source name + engagement + relative time + keyword tags

**Title**: H1, `text.primary`

**Score + Radar Row** (2 columns):
- Left (1/3): Composite score (large, animated count-up) + verdict pill + verdict_reason quote
- Right (2/3): ScoreRadar (8-axis hexagonal chart)

**Sub-scores** (full width card):
- 8 horizontal progress bars, one per criterion
- Each: label + bar + number + brief explanation
- Labels: Market, Automation, Pain Level, Competition, WTP, Margin, Build, Timing
- Source: `ideas.score_market`, `ideas.score_automation`, etc.
- Bar color: green (7+), yellow (4.5-7), red (<4.5)

**Business Plan Sections** (Accordion, full width):
Only for BUILD and BET ideas (where `business_plan IS NOT NULL`):
- ▸ Market Analysis — TAM/SAM/SOM, target audience
- ▸ Competition — table: name, pricing, users, weakness
- ▸ Revenue Model — pricing tiers, projected ARR
- ▸ Technical Feasibility — stack, build time, complexity
- ▸ Risks — cards: risk description, severity badge (high/medium/low), mitigation
- ▸ Launch Plan — checklist with checkboxes

For FLIP/KILL ideas: show only sub-scores and verdict_reason, no accordion.

**Notes** (full width card):
- Textarea, auto-save on blur/debounce to `idea_notes` table
- Placeholder: "Add your notes about this idea..."

**Action Bar** (sticky bottom):
- Fixed to bottom of viewport
- Background: `#0A0A0B`, border-top: `border.default`
- Padding: 16px 32px
- Buttons: `[✓ Validate +25XP]` `[✗ Reject +10XP]` `[⭐ Save]` `[🚀 Launch +100XP]`
- Launch button: gradient primary, only enabled if status='validated'
- On action: XP float animation + redirect to feed if approve/reject

### Data queries
```sql
SELECT * FROM ideas WHERE id = ?;
SELECT * FROM idea_notes WHERE idea_id = ?;
```

---

## Page 4: Trends (`/trends`)

Purpose: spot patterns — what's growing, what's declining, where the best ideas come from.

### Layout (bento grid)

**Time Range Selector**: `[7d] [30d] [90d] [All]` — pill tabs, top of page

**Row 1: Discovery Volume** (span 12)
- Recharts AreaChart, stacked by source
- X: dates, Y: idea count
- Each source = separate colored area (using source colors)
- Legend: toggleable source names at bottom
- Source: `SELECT date(discovered_at), source, COUNT(*) FROM ideas GROUP BY 1,2`

**Row 2** (2 panels):
- Score Distribution (span 6):
  - Histogram, buckets by 1.0 score increments
  - Bars colored by verdict zone (red/orange/yellow/green)
  - Source: `SELECT ROUND(score_composite), COUNT(*) FROM ideas GROUP BY 1`
- Source Performance (span 6):
  - Horizontal bar chart: avg composite score per source
  - Sorted by score desc
  - Source: `SELECT source, ROUND(AVG(score_composite),1) FROM ideas GROUP BY source`

**Row 3: Trending Keywords** (span 12)
- From `trend_signals` table
- Grouped by signal_type: rising, breakout, sustained
- Each keyword: clickable pill → navigates to `/ideas?keyword={keyword}`
- `breakout` keywords: purple bg, pulse animation
- Source: `SELECT keyword, signal_type, value FROM trend_signals ORDER BY detected_at DESC`

**Row 4** (2 panels):
- Budget (span 6):
  - Current month spend vs $3.00 limit
  - Progress bar, colored: green (<60%), yellow (60-80%), red (>80%)
  - Mini sparkline of daily spend
  - Source: `SELECT date(timestamp), SUM(cost_usd) FROM cost_log GROUP BY 1`
- Pipeline Funnel (span 6):
  - Horizontal bars: Found → Filtered → Scored → BUILD
  - Shows conversion rates between stages
  - Source: `SELECT SUM(items_found), SUM(items_passed_filter), SUM(items_scored) FROM daily_runs WHERE run_date >= ?`

### Chart styling (all Recharts)
- Background: transparent on surface1 cards
- Grid: dashed, `#2A2A2D`
- Axis labels: 11px `#71717A`
- Tooltip: bg `#1C1C1E`, border `#2A2A2D`, text `#ECECEC`, radius 8px
- Area fills: source color at 30% opacity → transparent gradient

---

## Page 5: Colonies (`/portfolio`)

Purpose: manage launched businesses.

### Empty State (shown when no validated/building/launched ideas)
- Centered vertically and horizontally
- Icon: `Castle` (lucide) at 64px, `text.muted`
- Title: "Your empire awaits." — H2, `text.primary`
- Subtitle: "No colonies deployed yet." — 14px, `text.secondary`
- CTA: "Find a BUILD-worthy discovery" — primary button → `/ideas?verdict=BUILD`

### Populated State
- Grid of colony cards (2-3 per row)
- Each card:
  - Title, original discovery date, source
  - Status timeline: `discovered → validated → building → launched → live`
  - Active step highlighted in accent blue, completed steps in green
  - Original composite score pill
  - Health dot: green (ok), yellow (needs attention), red (failing)
  - Source: `SELECT * FROM ideas WHERE status IN ('validated','building','launched') ORDER BY discovered_at DESC`

---

## Page 6: Achievements (`/stats`)

Purpose: see your progress, badges, statistics.

### Layout (single column)

**Profile Card** (top):
- LevelBadge (64px) + level title
- XPBar (full width)
- StreakFlame + "Best: {streak_best} days"
- "Member since {created_at}"
- Source: `user_stats`

**Badge Grid**:
- 5 columns on desktop, 3 on mobile
- Each badge: 64px icon, name below, unlock date
- Unlocked: full color + subtle glow
- Locked: grayscale silhouette, "???" name, hint on hover ("Hint: reject 10 ideas in a row")
- Source: `achievements` table, cross-referenced with full badge definitions in `lib/gamification/achievements.ts`

**Statistics Card**:
- 2-column layout of stat rows
- Stats: total reviewed, approved, rejected, approval rate, avg review time, BUILD found, best score, quests completed
- Numbers: JetBrains Mono, `text.primary`
- Labels: `text.secondary`
- Source: `user_stats` + `SELECT COUNT(*), AVG(...) FROM activity_log`
