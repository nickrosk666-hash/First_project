import TopBar from "@/components/layout/TopBar";
import { getUserStats, getAchievements } from "@/lib/queries/stats";
import { calculateLevel } from "@/types/gamification";
import { ACHIEVEMENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Flame, Lock } from "lucide-react";

export default function StatsPage() {
  const stats = getUserStats();
  const achievements = getAchievements();
  const level = calculateLevel(stats.xp);

  const tierColor = {
    bronze: "border-game-bronze text-game-bronze",
    silver: "border-game-silver text-game-silver",
    gold: "border-game-gold-bright text-game-gold-bright",
    diamond: "border-game-diamond text-game-diamond",
  }[level.tier];

  const unlockedIds = new Set(achievements.filter((a) => a.unlocked_at).map((a) => a.id));

  return (
    <>
      <TopBar title="Achievements" />
      <div className="p-6 space-y-6">
        {/* Profile */}
        <div className="p-6 rounded-card bg-bg-surface1 border border-border-default">
          <div className="flex items-center gap-6">
            <div className={cn("w-16 h-16 rounded-full border-3 flex items-center justify-center font-mono text-2xl font-bold", tierColor)}>
              {level.level}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-text-primary">Lv{level.level} {level.title}</h2>
              <div className="w-full max-w-xs h-2 rounded-full bg-bg-surface2 mt-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${level.next > 0 ? (level.current / level.next) * 100 : 100}%`,
                    background: "linear-gradient(90deg, #3B82F6, #8B5CF6)",
                  }}
                />
              </div>
              <span className="text-xs text-text-muted font-mono mt-1 block">{level.current}/{level.next} XP ({stats.xp} total)</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-game-gold animate-flame" />
              <div>
                <span className="text-xl font-mono font-bold text-game-gold">{stats.streak_current}</span>
                <span className="text-xs text-text-muted block">Best: {stats.streak_best} days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="p-6 rounded-card bg-bg-surface1 border border-border-default">
          <h3 className="text-sm font-medium text-text-primary mb-4">Badges</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {ACHIEVEMENTS.map((def) => {
              const unlocked = unlockedIds.has(def.id);
              return (
                <div
                  key={def.id}
                  className={cn(
                    "p-3 rounded-card border text-center transition-all",
                    unlocked
                      ? "bg-game-gold/5 border-game-gold/20"
                      : "bg-bg-surface2 border-border-default opacity-60"
                  )}
                >
                  <div className="text-2xl mb-1">{unlocked ? "🏅" : "🔒"}</div>
                  <div className="text-xs font-medium text-text-primary">
                    {unlocked ? def.name : def.secret ? "???" : def.name}
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">
                    {unlocked ? def.description : def.secret ? def.hint : def.hint}
                  </div>
                  <div className="text-[10px] font-mono text-accent-blue mt-1">+{def.xp} XP</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="p-6 rounded-card bg-bg-surface1 border border-border-default">
          <h3 className="text-sm font-medium text-text-primary mb-4">Stats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[
              { label: "Reviewed", value: stats.total_reviewed },
              { label: "Approved", value: stats.total_approved },
              { label: "Rejected", value: stats.total_rejected },
              { label: "Launched", value: stats.total_launched },
              { label: "Approval Rate", value: stats.total_reviewed > 0 ? `${Math.round((stats.total_approved / stats.total_reviewed) * 100)}%` : "0%" },
              { label: "Total XP", value: stats.xp },
              { label: "Current Streak", value: `${stats.streak_current} days` },
              { label: "Best Streak", value: `${stats.streak_best} days` },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-mono font-semibold text-text-primary">{stat.value}</div>
                <div className="text-xs text-text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
