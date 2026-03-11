import { type AchievementDef, type QuestDef } from "@/types/gamification";

export const XP_REWARDS = {
  login: 10,
  view: 5,
  approve: 25,
  reject: 10,
  launch: 100,
  quest_complete: 50,
  streak_7: 75,
} as const;

export const QUEST_POOL: QuestDef[] = [
  { id: "patrol", name: "Patrol", description: "Review at least 5 ideas", type: "daily", target: 5, xp: 20, icon: "Swords" },
  { id: "quick_draw", name: "Quick Draw", description: "Approve or reject 10 ideas", type: "daily", target: 10, xp: 30, icon: "Swords" },
  { id: "radar_check", name: "Radar Check", description: "Visit the Trends page", type: "daily", target: 1, xp: 10, icon: "Swords" },
  { id: "deep_dive", name: "Deep Dive", description: "Spend 30+ seconds on one idea", type: "daily", target: 1, xp: 15, icon: "Swords" },
  { id: "critic", name: "The Critic", description: "Reject 3 KILL-verdict ideas", type: "daily", target: 3, xp: 15, icon: "Swords" },
  { id: "treasure_hunt", name: "Treasure Hunt", description: "Find a BUILD idea (score 8+)", type: "daily", target: 1, xp: 25, icon: "Swords" },
  { id: "source_diversity", name: "Source Diversity", description: "View ideas from 5+ sources", type: "weekly", target: 5, xp: 50, icon: "Shield" },
  { id: "scout_master", name: "Scout Master", description: "Log in every day this week", type: "weekly", target: 7, xp: 100, icon: "Shield" },
  { id: "first_colony", name: "First Colony", description: "Launch your first MVP", type: "epic", target: 1, xp: 200, icon: "Crown" },
  { id: "empire_founder", name: "Empire Founder", description: "Launch 10 businesses", type: "epic", target: 10, xp: 500, icon: "Crown" },
  { id: "thousand_ideas", name: "Thousand Ideas", description: "Review 1000 ideas", type: "epic", target: 1000, xp: 300, icon: "Crown" },
  { id: "diamond_hunter", name: "Diamond Hunter", description: "Find 10 BUILD-verdict ideas", type: "epic", target: 10, xp: 250, icon: "Crown" },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_blood", name: "First Blood", description: "View your first idea", hint: "Open any idea", secret: false, xp: 10 },
  { id: "legendary_find", name: "Legendary Find", description: "View an idea with score 9+", hint: "Find a very high-scoring idea", secret: false, xp: 25 },
  { id: "picky_eater", name: "Picky Eater", description: "Reject 10 ideas in a row", hint: "Be very selective", secret: false, xp: 20 },
  { id: "speed_runner", name: "Speed Runner", description: "View 20 ideas in 10 minutes", hint: "Browse ideas quickly", secret: false, xp: 30 },
  { id: "build_order", name: "Build Order", description: "Approve your first BUILD idea", hint: "Validate a high-scoring idea", secret: false, xp: 25 },
  { id: "colony_founder", name: "Colony Founder", description: "Launch your first MVP", hint: "Deploy a colony", secret: false, xp: 50 },
  { id: "streak_3", name: "On Fire", description: "Reach 3-day streak", hint: "Log in 3 days in a row", secret: false, xp: 15 },
  { id: "streak_7", name: "Burning Bright", description: "Reach 7-day streak", hint: "Log in 7 days in a row", secret: false, xp: 25 },
  { id: "streak_30", name: "Inferno", description: "Reach 30-day streak", hint: "Log in 30 days in a row", secret: false, xp: 75 },
  { id: "source_explorer", name: "Source Explorer", description: "View ideas from all 9 sources", hint: "Explore every source", secret: false, xp: 30 },
  { id: "budget_hawk", name: "Budget Hawk", description: "Visit the budget section", hint: "???", secret: true, xp: 10 },
  { id: "night_owl", name: "Night Owl", description: "Use dashboard between 00:00-04:00", hint: "???", secret: true, xp: 15 },
  { id: "completionist", name: "Completionist", description: "Unlock 10 other badges", hint: "Collect many badges", secret: false, xp: 50 },
  { id: "data_hoarder", name: "Data Hoarder", description: "Have 500+ ideas in database", hint: "Let the pipeline run", secret: false, xp: 25 },
  { id: "the_butcher", name: "The Butcher", description: "Reject 100 ideas total", hint: "Say no a lot", secret: false, xp: 40 },
];

export const NAV_ITEMS = [
  { href: "/", label: "Command Center", icon: "Home" },
  { href: "/ideas", label: "Discoveries", icon: "Zap", showBadge: true },
  { href: "/trends", label: "Trends", icon: "TrendingUp" },
  { href: "/portfolio", label: "Colonies", icon: "Castle" },
  { href: "/stats", label: "Achievements", icon: "Trophy" },
] as const;

export const SCORE_LABELS: Record<string, { short: string; full: string }> = {
  score_market: { short: "Market", full: "Market Size" },
  score_automation: { short: "Auto", full: "Automation Feasibility" },
  score_pain_level: { short: "Pain", full: "Pain Level" },
  score_competition: { short: "Comp", full: "Competition" },
  score_willingness_to_pay: { short: "WTP", full: "Willingness to Pay" },
  score_margin: { short: "Margin", full: "Margin Potential" },
  score_build: { short: "Build", full: "Build Complexity" },
  score_timing: { short: "Timing", full: "Timing" },
};
