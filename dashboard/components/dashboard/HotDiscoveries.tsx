"use client";

import Link from "next/link";
import { cn, sourceColor, sourceName, engagementLabel, relativeTime } from "@/lib/utils";
import type { Idea } from "@/types/idea";
import ScorePill from "@/components/ideas/ScorePill";

interface HotDiscoveriesProps {
  ideas: Idea[];
}

export default function HotDiscoveries({ ideas }: HotDiscoveriesProps) {
  if (ideas.length === 0) return null;

  return (
    <div className="p-4 rounded-card bg-bg-surface1 border border-border-default">
      <h3 className="text-sm font-medium text-text-primary mb-3">🔥 Hot Discoveries</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {ideas.slice(0, 3).map((idea) => (
          <Link
            key={idea.id}
            href={`/ideas/${idea.id}`}
            className={cn(
              "block p-3 rounded-btn border transition-all duration-200",
              "hover:bg-bg-surface2",
              idea.verdict === "BUILD"
                ? "border-game-gold-bright/30 shadow-legendary"
                : "border-border-default hover:border-border-hover"
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sourceColor(idea.source) }} />
                <span className="text-[11px] text-text-muted">{sourceName(idea.source)}</span>
              </div>
              {idea.score_composite != null && idea.verdict && (
                <ScorePill score={idea.score_composite} verdict={idea.verdict} size="sm" />
              )}
            </div>
            <h4 className="text-sm font-medium text-text-primary leading-snug line-clamp-2 mb-2">
              {idea.title}
            </h4>
            <div className="text-[11px] text-text-muted">
              {idea.source_score > 0 && <span>{engagementLabel(idea.source, idea.source_score)} · </span>}
              {relativeTime(idea.discovered_at)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
