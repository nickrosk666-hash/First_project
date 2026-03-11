"use client";

import { Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateLevel } from "@/types/gamification";
import type { UserStats, Achievement } from "@/types/gamification";
import { ACHIEVEMENTS } from "@/lib/constants";

interface EmpirePanelProps {
  stats: UserStats;
  achievements: Achievement[];
}

export default function EmpirePanel({ stats, achievements }: EmpirePanelProps) {
  const level = calculateLevel(stats.xp);
  const tierColor = {
    bronze: "border-game-bronze text-game-bronze",
    silver: "border-game-silver text-game-silver",
    gold: "border-game-gold-bright text-game-gold-bright",
    diamond: "border-game-diamond text-game-diamond",
  }[level.tier];

  const unlockedAchievements = achievements
    .filter((a) => a.unlocked_at)
    .map((a) => ACHIEVEMENTS.find((def) => def.id === a.id))
    .filter(Boolean);

  return (
    <div className="p-4 rounded-card bg-bg-surface1 border border-border-default">
      <h3 className="text-sm font-medium text-text-primary mb-3">Your Empire</h3>

      {/* Streak */}
      {stats.streak_current > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-5 h-5 text-game-gold animate-flame" />
          <span className="text-sm text-text-primary font-medium">{stats.streak_current}-day streak</span>
          {stats.streak_current >= 7 && (
            <span className="text-[11px] px-2 py-0.5 rounded-pill bg-game-gold/10 text-game-gold font-medium">
              Silver milestone!
            </span>
          )}
        </div>
      )}

      {/* Level */}
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono text-sm font-bold", tierColor)}>
          {level.level}
        </div>
        <div>
          <div className="text-sm font-medium text-text-primary">Lv{level.level} {level.title}</div>
          <div className="w-32 h-1.5 rounded-full bg-bg-surface2 mt-1">
            <div
              className="h-full rounded-full"
              style={{
                width: `${level.next > 0 ? (level.current / level.next) * 100 : 100}%`,
                background: "linear-gradient(90deg, #3B82F6, #8B5CF6)",
              }}
            />
          </div>
          <span className="text-[11px] text-text-muted font-mono">{level.current}/{level.next} XP</span>
        </div>
      </div>

      {/* Recent badges */}
      {unlockedAchievements.length > 0 && (
        <div>
          <span className="text-xs text-text-muted mb-1.5 block">Latest badges:</span>
          <div className="flex flex-wrap gap-1.5">
            {unlockedAchievements.slice(0, 4).map((a) => (
              <span
                key={a!.id}
                className="text-[11px] px-2 py-1 rounded-pill bg-game-gold/10 text-game-gold font-medium"
                title={a!.description}
              >
                🏅 {a!.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
