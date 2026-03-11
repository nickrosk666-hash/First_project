import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import { getDb } from "@/lib/db";
import type { Idea } from "@/types/idea";
import { Castle, Zap } from "lucide-react";
import { cn, sourceColor, sourceName } from "@/lib/utils";
import ScorePill from "@/components/ideas/ScorePill";

function getLaunchedIdeas(): Idea[] {
  const db = getDb();
  try {
    return db.prepare("SELECT * FROM ideas WHERE status IN ('launched', 'building', 'validated') ORDER BY score_composite DESC").all() as Idea[];
  } catch { return []; }
}

export default function PortfolioPage() {
  const colonies = getLaunchedIdeas();

  return (
    <>
      <TopBar title="Colonies" />
      <div className="p-6">
        {colonies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Castle className="w-16 h-16 text-text-muted mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">Your empire awaits.</h2>
            <p className="text-text-secondary mb-6">No colonies deployed yet.</p>
            <p className="text-sm text-text-muted mb-6">
              Find a BUILD-worthy discovery and deploy your first colony.
            </p>
            <Link
              href="/ideas"
              className="flex items-center gap-2 px-4 py-2 rounded-btn text-sm font-medium text-white"
              style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
            >
              <Zap className="w-4 h-4" /> Go to Discoveries
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {colonies.map((idea) => (
              <Link
                key={idea.id}
                href={`/ideas/${idea.id}`}
                className="block p-4 rounded-card bg-bg-surface1 border border-border-default hover:border-border-hover transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sourceColor(idea.source) }} />
                    <span className="text-xs text-text-muted">{sourceName(idea.source)}</span>
                  </div>
                  {idea.score_composite != null && idea.verdict && (
                    <ScorePill score={idea.score_composite} verdict={idea.verdict} size="sm" />
                  )}
                </div>
                <h3 className="text-sm font-medium text-text-primary mb-2 line-clamp-2">{idea.title}</h3>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[11px] px-2 py-0.5 rounded-pill font-medium",
                    idea.status === "launched" ? "bg-accent-purple/10 text-accent-purple" :
                    idea.status === "building" ? "bg-verdict-bet/10 text-verdict-bet" :
                    "bg-verdict-build/10 text-verdict-build"
                  )}>
                    {idea.status === "launched" ? "🚀 Launched" : idea.status === "building" ? "🔨 Building" : "✓ Validated"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
