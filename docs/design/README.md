# Autonomy Dashboard — Design System

Dark-theme gamified dashboard for managing autonomous business discovery pipeline.
Style: Linear/Vercel-inspired dark minimalism. ADHD-friendly gamification.

## Files

| File | What | When to use |
|------|------|-------------|
| `01-design-tokens.json` | All colors, spacing, typography, animation values | Import in code or reference during development |
| `02-components.md` | Every UI component: buttons, cards, badges, charts | When building any component |
| `03-pages.md` | Page layouts, wireframes, SQL queries, data flow | When building page routes |
| `04-gamification.md` | XP, levels, streaks, quests, achievements, dopamine triggers | When building gamification features |
| `05-tailwind-preset.md` | Full Tailwind config + CSS variables + font setup | Copy directly into `tailwind.config.ts` and `globals.css` |
| `06-data-mapping.md` | How each DB field maps to UI elements | When connecting data to components |
| `07-principles.md` | Hard design rules, anti-patterns | Before making any design decision |

## Quick reference

### Verdict colors
- BUILD (8+): `#22C55E` green, gold border glow
- BET (6.5-8): `#EAB308` yellow
- FLIP (4.5-6.5): `#F97316` orange, dimmed
- KILL (<4.5): `#EF4444` red, very dimmed

### Background elevation
`#0A0A0B` → `#141415` → `#1C1C1E` → `#252528`

### Fonts
- UI: Inter
- Numbers/scores: JetBrains Mono

### Tech stack
Next.js 14+ · Tailwind v4 · shadcn/ui · better-sqlite3 · Recharts · framer-motion · Zustand · Lucide Icons
