"use client";

import { cn } from "@/lib/utils";
import type { DailyRun } from "@/types/idea";

interface PipelineHealthProps {
  runs: DailyRun[];
}

const ALL_SOURCES = ["google", "hackernews", "reddit", "youtube", "github", "devto", "producthunt", "techcrunch"];
const SOURCE_NAMES: Record<string, string> = {
  google: "Google", hackernews: "HN", reddit: "Reddit", youtube: "YouTube",
  github: "GitHub", devto: "Dev.to", producthunt: "PH", techcrunch: "News",
};

function getStatus(runs: DailyRun[], source: string) {
  const run = runs.find((r) => r.source === source);
  if (!run) return { icon: "🔲", label: "Not started", color: "text-text-muted" };
  if (run.errors) return { icon: "❌", label: "Error", color: "text-verdict-kill" };
  if (run.items_scored > 0) return { icon: "✅", label: "Done", color: "text-verdict-build" };
  return { icon: "⏳", label: "Running", color: "text-verdict-bet" };
}

export default function PipelineHealth({ runs }: PipelineHealthProps) {
  const totalFound = runs.reduce((s, r) => s + r.items_found, 0);
  const totalFiltered = runs.reduce((s, r) => s + r.items_passed_filter, 0);
  const totalScored = runs.reduce((s, r) => s + r.items_scored, 0);
  const totalErrors = runs.filter((r) => r.errors).length;

  return (
    <div className="p-4 rounded-card bg-bg-surface1 border border-border-default">
      <h3 className="text-sm font-medium text-text-primary mb-3">Pipeline Health (today)</h3>
      <div className="flex flex-wrap gap-3 mb-3">
        {ALL_SOURCES.map((source) => {
          const status = getStatus(runs, source);
          return (
            <div key={source} className={cn("flex items-center gap-1 text-xs", status.color)}>
              <span>{status.icon}</span>
              <span>{SOURCE_NAMES[source]}</span>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-text-muted">
        Found: <span className="text-text-secondary font-mono">{totalFound}</span>
        {" → Filtered: "}<span className="text-text-secondary font-mono">{totalFiltered}</span>
        {" → Scored: "}<span className="text-text-secondary font-mono">{totalScored}</span>
        {" · Errors: "}<span className={cn("font-mono", totalErrors > 0 ? "text-verdict-kill" : "text-text-secondary")}>{totalErrors}</span>
      </div>
    </div>
  );
}
