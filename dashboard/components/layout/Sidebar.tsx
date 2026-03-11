"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Zap, TrendingUp, Castle, Trophy, Settings, DollarSign, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { calculateLevel } from "@/types/gamification";

const ICONS: Record<string, React.ElementType> = {
  Home, Zap, TrendingUp, Castle, Trophy, Settings, DollarSign,
};

interface SidebarProps {
  xp?: number;
  streak?: number;
  pendingCount?: number;
  budgetUsed?: number;
}

export default function Sidebar({ xp = 0, streak = 0, pendingCount = 0, budgetUsed = 0 }: SidebarProps) {
  const pathname = usePathname();
  const level = calculateLevel(xp);

  const tierColor = {
    bronze: "border-game-bronze",
    silver: "border-game-silver",
    gold: "border-game-gold-bright",
    diamond: "border-game-diamond",
  }[level.tier];

  const budgetColor = budgetUsed < 1.8 ? "text-verdict-build" : budgetUsed < 2.4 ? "text-verdict-bet" : "text-verdict-kill";

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-bg-base border-r border-border-default flex flex-col z-40">
      {/* Logo */}
      <div className="px-4 pt-5 pb-3">
        <span className="text-sm font-bold tracking-[0.05em] text-text-primary">AUTONOMY</span>
      </div>

      {/* Player Card */}
      <div className="mx-3 p-3 rounded-card bg-bg-surface1 border border-border-default">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn("w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold text-text-primary", tierColor)}>
            {level.level}
          </div>
          <div>
            <div className="text-xs font-medium text-text-primary">Lv{level.level} {level.title}</div>
          </div>
        </div>
        {/* XP Bar */}
        <div className="w-full h-1 rounded-full bg-bg-surface2 mb-1.5">
          <div
            className="h-full rounded-full transition-all duration-600"
            style={{
              width: `${level.next > 0 ? (level.current / level.next) * 100 : 100}%`,
              background: "linear-gradient(90deg, #3B82F6, #8B5CF6)",
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-muted font-mono">{level.current}/{level.next} XP</span>
          {streak > 0 && (
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-game-gold animate-flame" />
              <span className="text-xs font-bold font-mono text-game-gold">{streak}</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 mt-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon] ?? Home;
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-btn text-sm transition-colors duration-150",
                isActive
                  ? "text-text-primary bg-bg-surface2 border-l-2 border-accent-blue pl-[10px]"
                  : "text-text-muted hover:text-text-secondary hover:bg-bg-surface1"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
              {"showBadge" in item && item.showBadge && pendingCount > 0 && (
                <span className="ml-auto text-[11px] font-mono bg-accent-blue/20 text-accent-blue px-1.5 py-0.5 rounded-pill">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 pb-4 space-y-0.5 border-t border-border-default pt-2 mt-2">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-btn text-sm text-text-muted hover:text-text-secondary hover:bg-bg-surface1 transition-colors duration-150"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>
        <div className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-muted">
          <DollarSign className="w-4 h-4" />
          <span>Budget</span>
          <span className={cn("ml-auto font-mono text-xs", budgetColor)}>
            ${budgetUsed.toFixed(2)}
          </span>
        </div>
      </div>
    </aside>
  );
}
