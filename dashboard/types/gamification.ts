export interface UserStats {
  id: number;
  xp: number;
  level: number;
  streak_current: number;
  streak_best: number;
  streak_last_date: string | null;
  streak_shield_available: number;
  total_reviewed: number;
  total_approved: number;
  total_rejected: number;
  total_launched: number;
  created_at: string;
}

export interface Achievement {
  id: string;
  unlocked_at: string | null;
  notified: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  hint: string;
  secret: boolean;
  xp: number;
}

export interface QuestProgress {
  id: string;
  quest_type: "daily" | "weekly" | "epic";
  quest_date: string | null;
  progress: number;
  target: number;
  completed: number;
  xp_reward: number;
}

export interface QuestDef {
  id: string;
  name: string;
  description: string;
  type: "daily" | "weekly" | "epic";
  target: number;
  xp: number;
  icon: string;
}

export interface ActivityEntry {
  id: number;
  action: string;
  idea_id: number | null;
  xp_earned: number;
  metadata: string | null;
  created_at: string;
  idea_title?: string;
}

export interface LevelInfo {
  level: number;
  title: string;
  current: number;
  next: number;
  tier: "bronze" | "silver" | "gold" | "diamond";
}

export const LEVEL_THRESHOLDS = [0, 50, 150, 400, 800, 1500, 3000, 6000, 12000, 25000];
export const LEVEL_TITLES = [
  "Scout", "Explorer", "Prospector", "Strategist", "Commander",
  "Mogul", "Tycoon", "Titan", "Overlord", "Architect of Empires",
];

export function calculateLevel(xp: number): LevelInfo {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[level - 1];
  const tier = level <= 3 ? "bronze" : level <= 5 ? "silver" : level <= 7 ? "gold" : "diamond";

  return {
    level,
    title: LEVEL_TITLES[level - 1] ?? "Unknown",
    current: xp - currentThreshold,
    next: nextThreshold - currentThreshold,
    tier,
  };
}
