"use client";

import { Swords, Shield, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestProgress } from "@/types/gamification";
import { QUEST_POOL } from "@/lib/constants";

interface QuestPanelProps {
  quests: QuestProgress[];
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  daily: Swords,
  weekly: Shield,
  epic: Crown,
};

const TYPE_COLORS: Record<string, string> = {
  daily: "text-accent-blue",
  weekly: "text-accent-purple",
  epic: "text-game-gold",
};

export default function QuestPanel({ quests }: QuestPanelProps) {
  return (
    <div className="p-4 rounded-card bg-bg-surface1 border border-border-default">
      <h3 className="text-sm font-medium text-text-primary mb-3">Daily Quests</h3>
      <div className="space-y-3">
        {quests.map((quest) => {
          const def = QUEST_POOL.find((q) => q.id === quest.id);
          const Icon = TYPE_ICONS[quest.quest_type] ?? Swords;
          const pct = Math.min((quest.progress / quest.target) * 100, 100);
          const isDone = quest.completed === 1;

          return (
            <div key={`${quest.id}-${quest.quest_date}`} className={cn(isDone && "opacity-60")}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4", TYPE_COLORS[quest.quest_type])} />
                  <span className="text-sm text-text-primary">{def?.name ?? quest.id}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-text-muted font-mono">
                    {quest.progress}/{quest.target}
                  </span>
                  <span className="text-accent-blue font-mono">+{quest.xp_reward}</span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-bg-surface2">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isDone ? "bg-verdict-build" : "bg-accent-blue"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {quests.length === 0 && (
          <p className="text-xs text-text-muted">No quests available today</p>
        )}
      </div>
    </div>
  );
}
