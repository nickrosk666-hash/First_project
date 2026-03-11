"use client";

import Link from "next/link";
import { cn, sourceColor, sourceName, engagementLabel, relativeTime, scoreToColor } from "@/lib/utils";
import { SCORE_LABELS } from "@/lib/constants";
import type { Idea } from "@/types/idea";
import ScorePill from "./ScorePill";

interface IdeaCardProps {
  idea: Idea;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

const SCORE_FIELDS = [
  "score_market", "score_automation", "score_pain_level", "score_competition",
  "score_willingness_to_pay", "score_margin", "score_build", "score_timing",
] as const;

export default function IdeaCard({ idea, onApprove, onReject }: IdeaCardProps) {
  const isLegendary = idea.verdict === "BUILD";
  const isJunk = idea.verdict === "KILL";
  const keywords: string[] = idea.keywords_matched ? JSON.parse(idea.keywords_matched) : [];

  return (
    <div
      className={cn(
        "group relative p-5 rounded-card border transition-all duration-200",
        "bg-bg-surface1 hover:bg-bg-surface2",
        isLegendary && "border-game-gold-bright/30 shadow-legendary animate-pulse-glow",
        !isLegendary && "border-border-default hover:border-border-hover",
        isJunk && "opacity-60 hover:opacity-80",
      )}
    >
      {/* Source + Score Pill */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Source indicator */}
          <div className="flex items-center gap-1.5 mb-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: sourceColor(idea.source) }}
            />
            <span className="text-xs text-text-muted">{sourceName(idea.source)}</span>
          </div>

          {/* Title */}
          <h3 className="text-base font-medium text-text-primary leading-snug mb-1.5 line-clamp-2">
            <Link href={`/ideas/${idea.id}`} className="hover:text-accent-blue transition-colors">
              {idea.title}
            </Link>
          </h3>

          {/* Description */}
          {idea.description && (
            <p className="text-sm text-text-secondary line-clamp-2 mb-3">{idea.description}</p>
          )}

          {/* Keywords */}
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {idea.category && (
                <span className="text-[11px] px-2 py-0.5 rounded-pill bg-bg-surface2 text-text-secondary font-medium">
                  #{idea.category}
                </span>
              )}
              {keywords.slice(0, 3).map((kw) => (
                <span key={kw} className="text-[11px] px-2 py-0.5 rounded-pill bg-bg-surface2 text-text-muted">
                  {kw}
                </span>
              ))}
              {keywords.length > 3 && (
                <span className="text-[11px] px-2 py-0.5 rounded-pill bg-bg-surface2 text-text-muted">
                  +{keywords.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Score Pill */}
        {idea.score_composite != null && idea.verdict && (
          <ScorePill score={idea.score_composite} verdict={idea.verdict} />
        )}
      </div>

      {/* Sub-scores (inline) */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
        {SCORE_FIELDS.map((field) => {
          const val = idea[field];
          if (val == null) return null;
          const label = SCORE_LABELS[field]?.short ?? field;
          return (
            <span key={field} className="text-xs text-text-muted">
              <span className="text-text-secondary">{label}</span>{" "}
              <span className={cn("font-mono font-medium", scoreToColor(val))}>{val}</span>
            </span>
          );
        })}
      </div>

      {/* Engagement + Time */}
      <div className="flex items-center gap-2 text-xs text-text-muted mb-3">
        {idea.source_score > 0 && (
          <>
            <span>{engagementLabel(idea.source, idea.source_score)}</span>
            <span>·</span>
          </>
        )}
        <span>{relativeTime(idea.discovered_at)}</span>
      </div>

      {/* Verdict reason */}
      {idea.verdict_reason && (
        <p className="text-xs text-text-secondary italic mb-4 line-clamp-2">
          Claude: &quot;{idea.verdict_reason}&quot;
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        {idea.status === "scored" && (
          <>
            <button
              onClick={() => onApprove?.(idea.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-medium bg-verdict-build text-text-inverse hover:brightness-110 transition-all"
            >
              ✓ Validate
              <span className="text-[10px] opacity-70">+25XP</span>
            </button>
            <button
              onClick={() => onReject?.(idea.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-medium border border-verdict-kill text-verdict-kill hover:bg-verdict-kill/10 transition-all"
            >
              ✗ Reject
              <span className="text-[10px] opacity-70">+10XP</span>
            </button>
          </>
        )}
        {idea.status === "validated" && (
          <span className="text-xs text-verdict-build font-medium">✓ Validated</span>
        )}
        {idea.status === "rejected" && (
          <span className="text-xs text-verdict-kill font-medium">✗ Rejected</span>
        )}
        <Link
          href={`/ideas/${idea.id}`}
          className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-medium text-text-muted border border-border-default hover:border-border-hover hover:text-text-secondary transition-all"
        >
          Detail →
        </Link>
      </div>
    </div>
  );
}
