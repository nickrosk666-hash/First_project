# UI Components Specification

Reference: `docs/design/01-design-tokens.json` for all color/spacing/animation values.

---

## Buttons

4 variants only. No other button styles allowed.

### Variants

| Variant | Background | Text | Border | Use case |
|---------|-----------|------|--------|----------|
| `primary` | gradient `#3B82F6 → #8B5CF6` at 135deg | `#FFFFFF` | none | Main CTA: "Validate", "Launch MVP", "Go to Discoveries" |
| `success` | `#22C55E` | `#FFFFFF` | none | "Approve", "Validate" on action bars |
| `danger` | transparent | `#EF4444` | `1px solid #EF4444` | "Reject" — outline style, feels deliberate |
| `ghost` | transparent | `#A1A1AA` | `1px solid #2A2A2D` | "Save", "Detail", secondary actions |

### Sizes

| Size | Height | Horizontal padding | Font size | Icon size |
|------|--------|-------------------|-----------|-----------|
| `sm` | 32px | 12px | 12px | 14px |
| `md` | 36px | 16px | 14px | 16px |
| `lg` | 40px | 20px | 14px | 16px |

### States

```
default  → hover (filter: brightness(1.1))
         → active (filter: brightness(0.95))
         → disabled (opacity: 0.5, pointer-events: none)
         → focus-visible (ring: 2px #3B82F6, offset: 2px)
```

### Icon placement
- Icon ALWAYS left of text, gap 6px
- Icon library: Lucide React, stroke-width 1.5, matching font size
- Icon-only buttons: square, same height as size, no padding difference

---

## IdeaCard

The main data unit. Represents one business idea from the pipeline.

### Verdict-based visual levels

| Verdict | Border | Background | Score pill bg | Score pill text | Extra |
|---------|--------|------------|--------------|-----------------|-------|
| BUILD (8+) | `rgba(251,191,36,0.3)` | `#141415` | `rgba(34,197,94,0.1)` | `#22C55E` | `box-shadow: 0 0 20px rgba(251,191,36,0.08)` — gold glow |
| BET (6.5-8) | `#2A2A2D` | `#141415` | `rgba(234,179,8,0.1)` | `#EAB308` | Standard card |
| FLIP (4.5-6.5) | `#2A2A2D` | `#141415` | `rgba(249,115,22,0.1)` | `#F97316` | `opacity: 0.85` on card |
| KILL (<4.5) | `#2A2A2D` | `#141415` | `rgba(239,68,68,0.1)` | `#EF4444` | `opacity: 0.6`, collapsed by default |

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ ● {source_color} {source_name}                      ┌─────┐│
│                                                      │{scor}││
│ {title}                                      (mono)  │{verd}││
│                                                      └─────┘│
│ {description — max 2 lines, truncate with ...}              │
│                                                             │
│ {keyword tags as pills}                                     │
│                                                             │
│ {sub-scores inline: Market 8 · Auto 9 · Pain 7 · ...}      │
│                                                             │
│ {source_score} pts · {relative_time}                        │
│                                                             │
│ Claude: "{verdict_reason — 1 line}"                         │
│                                                             │
│ [✓ Validate +25XP]  [✗ Reject +10XP]         [→ Detail]    │
└─────────────────────────────────────────────────────────────┘
```

### Score pill (top-right)
- Size: 48x48px (in card), 64x64px (on detail page)
- Border-radius: 12px
- Background: verdict bg color (10% opacity)
- Number: JetBrains Mono 18px bold, verdict solid color
- Verdict label: 10px uppercase, verdict solid color, below number
- Centered vertically and horizontally inside pill

### Source indicator (top-left)
- Colored dot: 8px circle, color from `colors.source[source]`
- Source name: 12px, `text.secondary`
- Gap between dot and name: 6px

### Sub-scores
- Inline row: `Market 8 · Auto 9 · Pain 7 · Comp 6 · WTP 8 · Marg 9 · Build 7 · Time 8`
- Labels: 12px `text.muted`
- Numbers: 12px JetBrains Mono, color by value:
  - 7+ = `#22C55E` (green)
  - 4.5-6.9 = `#EAB308` (yellow)
  - <4.5 = `#EF4444` (red)
- Separator: ` · ` in `text.muted`

### Keyword tags
- Pills: `background.surface2`, `text.secondary`, `radius.pill`
- Padding: 4px 8px
- Font: 11px
- Gap between pills: 6px
- Prefix: `#` before category name

### Action buttons (bottom)
- Validate: `success` variant, `sm` size
- Reject: `danger` variant, `sm` size
- Detail: `ghost` variant, `sm` size, right-aligned
- XP reward shown in button text: "+25XP" — motivates action

### Animation
- Enter: fade up from y+8, opacity 0→1, duration 200ms, stagger 50ms between cards
- Hover: border-color transition 150ms
- On approve: card slides right 100px + green glow + fade out, then removed from list
- On reject: card slides left 100px + red tint + fade out
- XP float: "+{N} XP" text rises from action button, y 0→-40, opacity 1→0, 800ms

### Keyboard selection
- Selected card: `border-left: 2px solid #3B82F6` replacing normal border

---

## StatCard

4 stat cards on the Command Center top row.

```
┌──────────────────┐
│   {value}        │   ← JetBrains Mono 32px semibold, animated count-up
│   {delta}        │   ← 12px, ▲ green or ▼ red, vs yesterday
│   {label}        │   ← 12px text.secondary
│   {sparkline}    │   ← 60x20px, 7-day mini line chart
└──────────────────┘
```

- Background: `surface1`
- Border: `border.default`
- Padding: 20px
- Radius: 12px
- Grid: span 3 columns (4 cards per row on desktop)
- Sparkline color: `accent.blue`, no axes, no labels, just the line
- Delta format: `▲ +34` (green) or `▼ -5` (red) or `— 0` (muted)
- Value animation: count up from 0 on page load, duration 600ms

---

## ScoreRadar

Hexagonal radar chart for 8 scoring criteria.

- 8 axes: Market, Automation, Pain, Competition, WTP, Margin, Build, Timing
- Fill: `accent.blue` at 20% opacity
- Stroke: `accent.blue` at 100%
- Dots: 4px circles at each vertex, `accent.blue`
- Grid: 3 concentric rings at 3.3, 6.6, 10 — color `border.default`, dashed
- Axis labels: 11px `text.secondary`, positioned outside chart
- Size: 280x280px
- Library: Recharts RadarChart

---

## QuestCard

```
┌──────────────────────────────────────────────┐
│ {icon}  {quest_name}               +{XP} XP │
│                                              │
│ {description — 1 line}                       │
│                                              │
│ {progress_bar}                    {N}/{target}│
└──────────────────────────────────────────────┘
```

- Icons by quest type:
  - Daily: `Swords` (lucide)
  - Weekly: `Shield`
  - Epic: `Crown`
- XP reward: `accent.blue`, right-aligned
- Progress bar: height 6px, radius pill, bg `surface2`, fill `accent.gradient`
- Counter: JetBrains Mono 12px
- Completed state: green border, checkmark overlay, "+{XP} XP" earned text

---

## XPBar

Thin progress bar in sidebar showing level progress.

```
Lv4 Strategist
████████░░░░░░░░ 340/400 XP
```

- Height: 4px
- Radius: pill
- Background: `surface2`
- Fill: `accent.gradient` (blue→purple)
- Text above: "Lv{N} {title}" — 12px `text.primary`
- Text below: "{current}/{next} XP" — 11px `text.muted`
- Animation: fill animates on XP gain, 600ms spring

---

## LevelBadge

Circular emblem showing current level.

- Size: 40x40px (sidebar), 64x64px (stats page)
- Shape: circle with 2px ring border
- Ring color by tier:
  - Lv1-3: `#CD7F32` (bronze)
  - Lv4-6: `#C0C0C0` (silver)
  - Lv7-9: `#FFD700` (gold)
  - Lv10: rainbow gradient, animated rotation
- Center: level number, JetBrains Mono 16px bold
- Below badge: level title, 11px `text.secondary`

---

## StreakFlame

Animated flame icon + day count in sidebar.

- SVG flame icon, color `gamification.gold`
- Day number: JetBrains Mono 14px bold, next to flame
- CSS animation: gentle sway (translateX ±1px, rotate ±2deg), 2s infinite
- Milestone badges next to number:
  - 3d: bronze dot
  - 7d: silver dot
  - 14d: gold dot
  - 30d: platinum dot (glow)
  - 100d: diamond dot (sparkle)

---

## AchievementPopup

Toast notification for unlocked achievements.

- Slides in from top-right
- Width: 320px
- Background: `surface1` with `border: 1px solid rgba(251,191,36,0.3)` (gold border)
- Box-shadow: `0 0 20px rgba(251,191,36,0.1)` (gold glow)
- Layout: badge icon (40px) left, title + description right
- Title: "Achievement Unlocked!" — 12px, `gamification.gold_bright`
- Badge name: 14px bold, `text.primary`
- "+{XP} XP" — 12px, `accent.blue`
- Auto-dismiss: 5000ms
- Queue: if multiple unlock at once, 300ms delay between toasts
- Enter animation: slideInRight 300ms ease-out
- Exit animation: fadeOut + slideRight 200ms

---

## CommandPalette

Global search and navigation (Cmd+K / Ctrl+K).

- Overlay: `elevation.modal_overlay`
- Panel: `elevation.modal`, width 560px, positioned center top 20%
- Radius: 16px
- Input: 16px font, no border, transparent bg, placeholder "Search ideas, commands..."
- Results grouped: "Recent", "Ideas", "Quick Actions"
- Each result: icon + title + optional badge (score pill for ideas)
- Selected result: `background.surface2`
- Keyboard: ↑↓ navigate, Enter select, Esc close

---

## Skeleton Loading

Shown while data loads. Matches component layout exactly.

- Base color: `#1C1C1E`
- Shimmer: gradient sweep `#1C1C1E → #252528 → #1C1C1E`, 1500ms loop
- Radius: same as target component
- No spinners anywhere in the app

---

## Verdict Tabs

Filter bar for idea feed.

```
[All 247] [BUILD 12] [BET 89] [FLIP 103] [KILL 43]
```

- Container: gap 4px, single row
- Tab pill: padding 8px 12px, radius pill
- Inactive: `text.muted`, transparent bg
- Hover: `text.secondary`, `surface1` bg
- Active: `text.primary`, verdict bg color (10%), underline 2px in verdict solid color
- Count: JetBrains Mono 12px, same color as text

---

## Tables (Competition, etc.)

Used inside business plan sections.

- No visible outer border
- Header row: `text.muted`, 11px uppercase, border-bottom `border.default`
- Body rows: 14px `text.primary`, border-bottom `border.default` (subtle)
- Hover row: `surface2` background
- Cell padding: 12px horizontal, 10px vertical
- No zebra striping (too noisy on dark bg)

---

## Progress Bars

Used for sub-scores, quest progress, budget, XP.

- Height: 6px (quests, budget), 4px (XP bar, sub-scores)
- Radius: pill
- Track: `surface2`
- Fill color: context-dependent (verdict color for scores, gradient for XP, green for budget ok)
- Animation: width 0→N% on mount, 600ms spring easing
