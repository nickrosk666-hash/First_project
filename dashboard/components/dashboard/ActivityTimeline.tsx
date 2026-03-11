"use client";

import Link from "next/link";
import { Eye, Check, X, LogIn, TrendingUp, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityEntry } from "@/types/gamification";

interface ActivityTimelineProps {
  entries: ActivityEntry[];
}

const ACTION_ICONS: Record<string, { icon: React.ElementType; label: (e: ActivityEntry) => string }> = {
  login: { icon: LogIn, label: () => "Logged in" },
  view: { icon: Eye, label: (e) => `Viewed "${e.idea_title ?? "idea"}"` },
  approve: { icon: Check, label: (e) => `Approved "${e.idea_title ?? "idea"}"` },
  reject: { icon: X, label: (e) => `Rejected "${e.idea_title ?? "idea"}"` },
  launch: { icon: Rocket, label: (e) => `Launched "${e.idea_title ?? "idea"}"` },
  visit_trends: { icon: TrendingUp, label: () => "Checked Trends" },
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ActivityTimeline({ entries }: ActivityTimelineProps) {
  return (
    <div className="p-4 rounded-card bg-bg-surface1 border border-border-default">
      <h3 className="text-sm font-medium text-text-primary mb-3">Recent Activity</h3>
      <div className="space-y-2">
        {entries.map((entry) => {
          const config = ACTION_ICONS[entry.action] ?? { icon: Eye, label: () => entry.action };
          const Icon = config.icon;

          return (
            <div key={entry.id} className="flex items-center gap-3 text-xs">
              <span className="text-text-muted font-mono w-12 shrink-0">{formatTime(entry.created_at)}</span>
              <Icon className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span className="text-text-secondary truncate flex-1">
                {config.label(entry)}
              </span>
              {entry.xp_earned > 0 && (
                <span className="text-accent-blue font-mono shrink-0">+{entry.xp_earned} XP</span>
              )}
            </div>
          );
        })}
        {entries.length === 0 && (
          <p className="text-xs text-text-muted">No activity yet today</p>
        )}
      </div>
    </div>
  );
}
