"use client";

import { useState, useCallback } from "react";
import type { Idea, Verdict, IdeaSource } from "@/types/idea";
import IdeaCard from "./IdeaCard";
import VerdictTabs from "./VerdictTabs";
import { cn } from "@/lib/utils";

interface IdeaFeedProps {
  initialIdeas: Idea[];
  counts: Record<string, number>;
  initialVerdict: Verdict | null;
  initialSource: string | null;
  initialKeyword: string | null;
}

const SOURCES: Array<{ value: IdeaSource | ""; label: string }> = [
  { value: "", label: "All Sources" },
  { value: "hackernews", label: "HackerNews" },
  { value: "reddit", label: "Reddit" },
  { value: "google", label: "Google News" },
  { value: "youtube", label: "YouTube" },
  { value: "github", label: "GitHub" },
  { value: "devto", label: "Dev.to" },
  { value: "producthunt", label: "ProductHunt" },
  { value: "techcrunch", label: "TechCrunch" },
];

export default function IdeaFeed({
  initialIdeas,
  counts,
  initialVerdict,
  initialSource,
  initialKeyword,
}: IdeaFeedProps) {
  const [ideas, setIdeas] = useState(initialIdeas);
  const [verdict, setVerdict] = useState<Verdict | null>(initialVerdict);
  const [source, setSource] = useState<string>(initialSource || "");
  const [loading, setLoading] = useState(false);

  const fetchIdeas = useCallback(async (v: Verdict | null, s: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (v) params.set("verdict", v);
    if (s) params.set("source", s);
    try {
      const res = await fetch(`/api/ideas?${params}`);
      const data = await res.json();
      setIdeas(data.ideas);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerdictChange = (v: Verdict | null) => {
    setVerdict(v);
    fetchIdeas(v, source);
  };

  const handleSourceChange = (s: string) => {
    setSource(s);
    fetchIdeas(verdict, s);
  };

  const handleAction = async (id: number, action: "approve" | "reject") => {
    const res = await fetch(`/api/ideas/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const data = await res.json();
      setIdeas((prev) =>
        prev.map((idea) => (idea.id === id ? data.idea : idea))
      );
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <VerdictTabs counts={counts} active={verdict} onChange={handleVerdictChange} />

        <select
          value={source}
          onChange={(e) => handleSourceChange(e.target.value)}
          className="px-3 py-2 rounded-btn bg-bg-surface1 border border-border-default text-sm text-text-secondary hover:border-border-hover focus:border-border-focus focus:outline-none transition-colors"
        >
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Ideas Grid */}
      <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-3", loading && "opacity-50 pointer-events-none transition-opacity")}>
        {ideas.map((idea, i) => (
          <div
            key={idea.id}
            style={{ animationDelay: `${i * 50}ms` }}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-backwards"
          >
            <IdeaCard
              idea={idea}
              onApprove={(id) => handleAction(id, "approve")}
              onReject={(id) => handleAction(id, "reject")}
            />
          </div>
        ))}
      </div>

      {ideas.length === 0 && !loading && (
        <div className="text-center py-16">
          <p className="text-text-muted text-lg">No discoveries found</p>
          <p className="text-text-muted text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
