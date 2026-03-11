# Gamification System Specification

Everything here is stored in SQLite and rendered by the dashboard.
No external services. Single-user system.

---

## XP System

### Actions and rewards

| Action | XP | DB trigger |
|--------|-----|-----------|
| Daily login | +10 | `activity_log.action = 'login'`, once per day |
| View idea (>5 sec on detail page) | +5 | `activity_log.action = 'view'` |
| Approve / Validate idea | +25 | `ideas.status` → 'validated' |
| Reject idea | +10 | `ideas.status` → 'rejected' |
| Launch MVP | +100 | `ideas.status` → 'building' |
| Complete quest | +50 | `quest_progress.completed = 1` |
| 7-day streak bonus | +75 | `user_stats.streak_current >= 7`, once per streak milestone |

**Variable reinforcement**: add random ±2 XP to view/approve/reject actions. Unpredictability strengthens dopamine response (Duolingo research).

### Level thresholds

| Level | Title | XP Required | Badge ring |
|-------|-------|-------------|------------|
| 1 | Scout | 0 | bronze `#CD7F32` |
| 2 | Explorer | 50 | bronze |
| 3 | Prospector | 150 | bronze |
| 4 | Strategist | 400 | silver `#C0C0C0` |
| 5 | Commander | 800 | silver |
| 6 | Mogul | 1500 | gold `#FFD700` |
| 7 | Tycoon | 3000 | gold |
| 8 | Titan | 6000 | diamond `#B9F2FF` |
| 9 | Overlord | 12000 | diamond + glow |
| 10 | Architect of Empires | 25000 | rainbow gradient, animated |

Levels 1-3 are reachable in first session (~30 min). Instant reward hook.

### Level-up behavior
1. XP bar fills to 100%, flashes white
2. Confetti burst (canvas-confetti: 60 particles, spread 70, origin y 0.6)
3. Level badge updates with new ring color
4. If new tier (bronze→silver, etc.): extra confetti + achievement unlock
5. XP bar resets to show progress toward next level

### Calculation

```typescript
const LEVEL_THRESHOLDS = [0, 50, 150, 400, 800, 1500, 3000, 6000, 12000, 25000];

function calculateLevel(xp: number): { level: number; current: number; next: number } {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return {
        level: i + 1,
        current: xp - LEVEL_THRESHOLDS[i],
        next: (LEVEL_THRESHOLDS[i + 1] ?? LEVEL_THRESHOLDS[i]) - LEVEL_THRESHOLDS[i]
      };
    }
  }
  return { level: 1, current: 0, next: 50 };
}
```

---

## Streaks

### Rules
- Streak increments when user logs in on a new calendar day (UTC)
- Streak resets to 0 if no login for >24h from last login date
- **Streak Shield**: 1 free miss per 30 days. Auto-consumed if user misses a day and shield is available. Regenerates 30 days after use.

### Milestones

| Days | Tier | Visual |
|------|------|--------|
| 3 | Bronze | bronze dot next to flame |
| 7 | Silver | silver dot, streak bonus +75 XP |
| 14 | Gold | gold dot |
| 30 | Platinum | platinum dot with subtle glow |
| 100 | Diamond | diamond dot with sparkle animation |

### Storage

```sql
-- In user_stats (single row, id=1):
streak_current INTEGER        -- current consecutive days
streak_best INTEGER           -- all-time best
streak_last_date TEXT          -- 'YYYY-MM-DD' of last login
streak_shield_available INTEGER -- 1 = available, 0 = used
```

### Logic on login

```
today = current date (UTC)
last = streak_last_date

if last == today:
    do nothing (already counted)
elif last == yesterday:
    streak_current += 1
    streak_last_date = today
    if streak_current > streak_best: streak_best = streak_current
    check milestone rewards
elif streak_shield_available == 1 AND last == day_before_yesterday:
    streak_shield_available = 0
    streak_current += 1  (shield saved the streak)
    streak_last_date = today
    show "Streak Shield used!" notification
else:
    streak_current = 1
    streak_last_date = today
```

---

## Quests

### Quest types

**Daily** — refresh at 00:00 UTC. Pick 3-5 from pool.
**Weekly** — refresh Monday 00:00 UTC. Pick 2-3.
**Epic** — permanent, never expire.

### Daily quest pool

| ID | Name | Description | Target | XP |
|----|------|------------|--------|-----|
| `patrol` | Patrol | Review at least 5 ideas | 5 views | +20 |
| `quick_draw` | Quick Draw | Approve or reject 10 ideas | 10 actions | +30 |
| `radar_check` | Radar Check | Visit the Trends page | 1 visit | +10 |
| `deep_dive` | Deep Dive | Spend 30+ seconds on one idea detail | 1 long view | +15 |
| `critic` | The Critic | Reject 3 KILL-verdict ideas | 3 KILL rejects | +15 |
| `treasure_hunt` | Treasure Hunt | Find a BUILD idea (view one with score 8+) | 1 BUILD view | +25 |

Selection: pick 3-5 randomly each day. Always include `patrol` (anchor habit, like Duolingo's "complete 1 lesson").

### Weekly quest pool

| ID | Name | Description | Target | XP |
|----|------|------------|--------|-----|
| `source_diversity` | Source Diversity | View ideas from 5+ different sources | 5 sources | +50 |
| `scout_master` | Scout Master | Log in every day this week | 7 logins | +100 |
| `data_driven` | Data Driven | Review all ideas discovered this week | all ideas | +75 |
| `budget_watch` | Budget Watch | Check the budget on Trends page | 1 visit | +25 |

### Epic quests (permanent)

| ID | Name | Description | Target | XP |
|----|------|------------|--------|-----|
| `first_colony` | First Colony | Launch your first MVP | 1 launch | +200 |
| `empire_founder` | Empire Founder | Launch 10 businesses | 10 launches | +500 |
| `thousand_ideas` | Thousand Ideas | Review 1000 ideas total | 1000 views | +300 |
| `diamond_hunter` | Diamond Hunter | Find 10 BUILD-verdict ideas | 10 BUILD views | +250 |

### Storage

```sql
-- quest_progress table
-- PRIMARY KEY is (id, quest_date) so daily quests get new rows each day

INSERT INTO quest_progress (id, quest_type, quest_date, progress, target, completed, xp_reward)
VALUES ('patrol', 'daily', '2026-03-10', 0, 5, 0, 20);
```

### Completion behavior
1. Progress bar fills to 100%
2. Green checkmark overlay on quest card
3. "COMPLETE" stamp (slight rotation, scale up then settle)
4. XP float: "+{XP} XP"
5. Quest card stays visible (completed state) until end of day/week

---

## Achievements

### Full badge list

| ID | Name | Condition | Secret? | XP |
|----|------|-----------|---------|-----|
| `first_blood` | First Blood | View your first idea | No | +10 |
| `legendary_find` | Legendary Find | View an idea with score 9+ | No | +25 |
| `picky_eater` | Picky Eater | Reject 10 ideas in a row | No | +20 |
| `speed_runner` | Speed Runner | View 20 ideas in under 10 minutes | No | +30 |
| `build_order` | Build Order | Approve your first BUILD idea | No | +25 |
| `colony_founder` | Colony Founder | Launch your first MVP | No | +50 |
| `streak_3` | On Fire | Reach 3-day streak | No | +15 |
| `streak_7` | Burning Bright | Reach 7-day streak | No | +25 |
| `streak_30` | Inferno | Reach 30-day streak | No | +75 |
| `source_explorer` | Source Explorer | View ideas from all sources (9 sources) | No | +30 |
| `budget_hawk` | Budget Hawk | Visit the budget section | Yes | +10 |
| `night_owl` | Night Owl | Use dashboard between 00:00-04:00 | Yes | +15 |
| `completionist` | Completionist | Unlock 10 other badges | No | +50 |
| `data_hoarder` | Data Hoarder | Have 500+ ideas in database | No | +25 |
| `the_butcher` | The Butcher | Reject 100 ideas total | No | +40 |

### States
- **Locked**: grayscale silhouette, "???" name, hint text on hover
- **Unlocked**: full color, name visible, unlock date shown
- **New** (unlocked but not yet acknowledged): AchievementPopup toast

### Check timing
Achievements are checked after every user action (approve, reject, view, login). The check function runs through all locked achievements and tests conditions.

### Storage

```sql
-- When unlocked:
INSERT INTO achievements (id, unlocked_at, notified)
VALUES ('first_blood', datetime('now'), 0);

-- After toast shown, mark notified:
UPDATE achievements SET notified = 1 WHERE id = 'first_blood';
```

---

## Dopamine triggers summary

| Trigger | When | Visual | Duration |
|---------|------|--------|----------|
| Score Reveal | Open idea detail | Number counts 0→value, color shifts red→yellow→green | 1200ms |
| XP Float | Any XP-earning action | "+{N} XP" text rises and fades from action point | 800ms |
| Confetti | Level-up, first colony launch | canvas-confetti burst, 60 particles | 2000ms |
| Achievement Toast | Badge unlock | Gold-bordered card slides in from top-right | 300ms in, 5000ms visible |
| Quest Complete | Quest target reached | Green check + "COMPLETE" stamp on quest card | 400ms |
| Loot Glow | BUILD idea in feed | Gold pulsing border on card | continuous, subtle |
| New Loot Banner | Unreviewed ideas exist | "⚡ N new discoveries" with sparkle | shown until dismissed |
| Streak Milestone | New streak tier reached | Flame animation intensifies, tier dot appears | 600ms |
| Progress Fill | Any progress bar change | Width animates from old to new value | 600ms spring |

### What we deliberately avoid
- Countdown timers (pressure kills ADHD engagement)
- "You're falling behind" messaging (guilt = disengagement)
- Leaderboards vs others (single user, no comparison anxiety)
- Punishments for inaction (no XP loss, no streak damage beyond reset)
- Sound by default (all sounds opt-in via Settings)
- Looping attention-grabbing animations (except streak flame which is very subtle)
