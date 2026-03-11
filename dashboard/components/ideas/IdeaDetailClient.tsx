"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Star, Rocket } from "lucide-react";
import { cn, sourceColor, sourceName, engagementLabel, relativeTime, verdictToColor } from "@/lib/utils";
import type { Idea, BusinessPlan } from "@/types/idea";
import ScorePill from "./ScorePill";
import ScoreRadar from "./ScoreRadar";
import ScoreBars from "./ScoreBars";
import BusinessPlanView from "./BusinessPlanView";

interface IdeaDetailClientProps {
  idea: Idea;
}

export default function IdeaDetailClient({ idea: initialIdea }: IdeaDetailClientProps) {
  const [idea, setIdea] = useState(initialIdea);
  const [acting, setActing] = useState(false);
  const router = useRouter();
  const keywords: string[] = idea.keywords_matched ? JSON.parse(idea.keywords_matched) : [];
  const businessPlan: BusinessPlan | null = idea.business_plan ? JSON.parse(idea.business_plan) : null;

  const handleAction = async (action: "approve" | "reject" | "launch") => {
    setActing(true);
    try {
      const res = await fetch(`/api/ideas/${idea.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setIdea(data.idea);
      }
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="p-6 pb-24 max-w-5xl">
      {/* Meta line */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-sm text-text-muted">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sourceColor(idea.source) }} />
        <span>{sourceName(idea.source)}</span>
        {idea.source_score > 0 && (
          <>
            <span>·</span>
            <span>{engagementLabel(idea.source, idea.source_score)}</span>
          </>
        )}
        <span>·</span>
        <span>{relativeTime(idea.discovered_at)}</span>
        {idea.source_url && (
          <>
            <span>·</span>
            <a href={idea.source_url} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline inline-flex items-center gap-1">
              Source <ExternalLink className="w-3 h-3" />
            </a>
          </>
        )}
      </div>

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {idea.category && (
            <span className="text-xs px-2.5 py-1 rounded-pill bg-bg-surface2 text-text-secondary font-medium">
              #{idea.category}
            </span>
          )}
          {keywords.map((kw) => (
            <span key={kw} className="text-xs px-2.5 py-1 rounded-pill bg-bg-surface2 text-text-muted">
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      {idea.description && (
        <p className="text-text-secondary mb-8 leading-relaxed">{idea.description}</p>
      )}

      {/* Score + Radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Score Block */}
        <div className="p-6 rounded-card bg-bg-surface1 border border-border-default">
          <div className="flex items-center gap-4 mb-6">
            {idea.score_composite != null && idea.verdict && (
              <ScorePill score={idea.score_composite} verdict={idea.verdict} size="lg" />
            )}
            <div>
              {idea.verdict && (
                <p className={cn("text-lg font-semibold", verdictToColor(idea.verdict))}>{idea.verdict}</p>
              )}
              {idea.verdict_reason && (
                <p className="text-sm text-text-secondary italic mt-1">&quot;{idea.verdict_reason}&quot;</p>
              )}
            </div>
          </div>
          <ScoreBars idea={idea} />
        </div>

        {/* Radar Chart */}
        <div className="p-6 rounded-card bg-bg-surface1 border border-border-default">
          <h3 className="text-sm font-medium text-text-primary mb-2">Score Radar</h3>
          <ScoreRadar idea={idea} />
        </div>
      </div>

      {/* Business Plan */}
      {businessPlan && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Business Plan</h2>
          <BusinessPlanView plan={businessPlan} />
        </div>
      )}

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-60 right-0 bg-bg-base/90 backdrop-blur-sm border-t border-border-default px-6 py-3 flex items-center gap-3 z-30">
        {idea.status === "scored" && (
          <>
            <button
              onClick={() => handleAction("approve")}
              disabled={acting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-btn text-sm font-medium bg-verdict-build text-text-inverse hover:brightness-110 transition-all disabled:opacity-50"
            >
              ✓ Validate <span className="text-xs opacity-70">+25XP</span>
            </button>
            <button
              onClick={() => handleAction("reject")}
              disabled={acting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-btn text-sm font-medium border border-verdict-kill text-verdict-kill hover:bg-verdict-kill/10 transition-all disabled:opacity-50"
            >
              ✗ Reject <span className="text-xs opacity-70">+10XP</span>
            </button>
          </>
        )}
        {idea.status === "validated" && (
          <>
            <span className="text-sm text-verdict-build font-medium">✓ Validated</span>
            <button
              onClick={() => handleAction("launch")}
              disabled={acting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-btn text-sm font-medium text-white hover:brightness-110 transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
            >
              <Rocket className="w-4 h-4" /> Launch MVP <span className="text-xs opacity-70">+100XP</span>
            </button>
          </>
        )}
        {idea.status === "rejected" && (
          <span className="text-sm text-verdict-kill font-medium">✗ Rejected</span>
        )}
        {idea.status === "launched" && (
          <span className="text-sm font-medium" style={{ color: "#8B5CF6" }}>🚀 Launched</span>
        )}
      </div>
    </div>
  );
}
