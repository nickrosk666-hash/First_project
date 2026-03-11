"use client";

import { cn } from "@/lib/utils";
import type { Verdict } from "@/types/idea";

interface VerdictTabsProps {
  counts: Record<string, number>;
  active: Verdict | null;
  onChange: (verdict: Verdict | null) => void;
}

const tabs: Array<{ key: Verdict | null; label: string; color: string }> = [
  { key: null, label: "All", color: "text-text-primary" },
  { key: "BUILD", label: "BUILD", color: "text-verdict-build" },
  { key: "BET", label: "BET", color: "text-verdict-bet" },
  { key: "FLIP", label: "FLIP", color: "text-verdict-flip" },
  { key: "KILL", label: "KILL", color: "text-verdict-kill" },
];

export default function VerdictTabs({ counts, active, onChange }: VerdictTabsProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-card bg-bg-surface1 border border-border-default">
      {tabs.map((tab) => {
        const count = tab.key ? (counts[tab.key] ?? 0) : (counts.ALL ?? 0);
        const isActive = active === tab.key;

        return (
          <button
            key={tab.label}
            onClick={() => onChange(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-sm font-medium transition-colors duration-150",
              isActive
                ? "bg-bg-surface3 text-text-primary"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            <span className={cn(isActive && tab.color)}>{tab.label}</span>
            <span className={cn(
              "text-xs font-mono px-1.5 py-0.5 rounded-pill",
              isActive ? "bg-bg-surface2 text-text-secondary" : "text-text-muted"
            )}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
