# Design Principles

Hard rules for every screen, component, and interaction.
When in doubt, follow these.

---

## 1. Clarity over decoration

Every pixel must communicate. No gradients for beauty. No shadows for depth. No icons for fun.
If an element doesn't help the user understand where they are or what to do — remove it.

Typography and spacing do the hierarchy work. Not color, not size, not effects.

**Test**: cover all colors, keep only grayscale. Does the hierarchy still read? If yes — good.

## 2. One action per screen

The user should always know "what do I do here?".

| Page | Primary action |
|------|---------------|
| Command Center | "Review the hot discoveries" → click Review |
| Discoveries | "Approve or reject ideas" → Validate / Reject buttons |
| Idea Detail | "Make a decision on this idea" → sticky action bar |
| Trends | "Spot patterns" → visual scanning, no required action |
| Colonies | "Check empire health" → status at a glance |
| Achievements | "See progress" → no required action |

## 3. Never pure black

`#000000` causes halation (bright text on pure black bleeds into surroundings).
Darkest allowed: `#0A0A0B`. Cards: `#141415`. Never darker.

## 4. 4-second rule

If someone opens any page, they must understand what they're looking at within 4 seconds.
- Page title is always visible (H1, top-left)
- Active nav item in sidebar is always highlighted
- Data has clear labels (not just numbers)
- Empty states explain what goes here

## 5. No cognitive overload

- Max 4 stat cards per row
- Max 8 items visible in a list without scrolling
- Max 3 filter controls visible simultaneously
- Collapsed sections for secondary info (accordion)
- Progressive disclosure: summary → click → detail

## 6. Reward, never punish

- Missed a day? Streak resets quietly. No "you lost your streak!" popup.
- No ideas reviewed today? No guilt message. Quests just stay at 0/5.
- Rejected an idea? Still get +10 XP. Saying no is progress.
- Budget overrun? Yellow/red indicator, no alarm.

## 7. Motion has purpose

Every animation must answer: "what does this help the user understand?"

| Animation | Purpose |
|-----------|---------|
| Card fade-in | "Data loaded" |
| Score count-up | "This is exciting, pay attention to this number" |
| XP float | "Your action was counted, you earned something" |
| Progress fill | "You moved forward" |
| Confetti | "Major milestone, celebrate" |

If you can't articulate the purpose — remove the animation.

## 8. Keyboard-first, mouse-friendly

Power users navigate with keyboard. New users click.
Both paths must work for every action.

- J/K moves between ideas
- A approves, R rejects, Enter opens detail
- Cmd+K opens search
- F toggles focus mode
- Esc closes modals/goes back

Ghost key hints shown at bottom of relevant pages. Never require keyboard — always optional.

## 9. Consistent spacing

Use only values from the spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px.
No arbitrary values. No "just make it look right."
If two elements need more or less space — pick the nearest scale value.

## 10. Color means something

Color is never decorative. It always encodes information:

| Color | Meaning | Used for |
|-------|---------|----------|
| Green `#22C55E` | Good / success / BUILD | Score 7+, approve, active, growth delta |
| Yellow `#EAB308` | Attention / BET | Score 4.5-7, pending, warning |
| Orange `#F97316` | Caution / FLIP | Score 4.5-6.5, dimmed |
| Red `#EF4444` | Bad / KILL / error | Score <4.5, reject, error, decline delta |
| Blue `#3B82F6` | Action / interactive | Buttons, links, selected, focus ring |
| Purple `#8B5CF6` | Special / premium | Gradient partner, breakout trends |
| Gold `#D4A574` | Achievement / reward | Badges, streak, XP |
| Source colors | Source identity | Dots, charts |

If you use color for something not in this table — you're probably wrong.

---

## Anti-patterns (never do these)

- Walls of text without visual breaks
- Tables with >6 columns
- More than 2 font sizes on one card
- Nesting cards inside cards
- Multiple competing CTAs in one view
- Scrolling carousels (use static grids)
- Toast notifications that stack >3 high
- Any element that blinks or flashes
- Placeholder text left in production ("Lorem ipsum")
- Different border-radius values on adjacent elements
