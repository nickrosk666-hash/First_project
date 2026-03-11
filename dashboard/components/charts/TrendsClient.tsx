"use client";

import { cn, sourceName } from "@/lib/utils";
import type { TrendSignal } from "@/types/idea";

interface TrendsClientProps {
  signals: TrendSignal[];
  distribution: Array<{ verdict: string; count: number }>;
  sourcePerformance: Array<{ source: string; avg_score: number; count: number }>;
  budgetUsed: number;
}

const SIGNAL_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  rising: { bg: "bg-accent-blue/10", text: "text-accent-blue", label: "rising" },
  breakout: { bg: "bg-accent-purple/10", text: "text-accent-purple", label: "breakout" },
  sustained: { bg: "bg-verdict-flip/10", text: "text-verdict-flip", label: "sustained" },
};

const VERDICT_COLORS: Record<string, string> = {
  BUILD: "bg-verdict-build",
  BET: "bg-verdict-bet",
  FLIP: "bg-verdict-flip",
  KILL: "bg-verdict-kill",
};

export default function TrendsClient({ signals, distribution, sourcePerformance, budgetUsed }: TrendsClientProps) {
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);
  const maxSourceScore = 10;

  return (
    <div className="space-y-6">
      {/* Score Distribution + Source Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Score Distribution */}
        <div className="p-4 rounded-card bg-bg-surface1 border border-border-default">
          <h3 className="text-sm font-medium text-text-primary mb-4">Score Distribution</h3>
          <div className="space-y-3">
            {["BUILD", "BET", "FLIP", "KILL"].map((verdict) => {
              const item = distribution.find((d) => d.verdict === verdict);
              const count = item?.count ?? 0;
              const pct = (count / maxCount) * 100;
              return (
                <div key={verdict}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-text-secondary">{verdict}</span>
                    <span className="text-sm font-mono text-text-primary">{count}</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-bg-surface2">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", VERDICT_COLORS[verdict])}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Source Performance */}
        <div className="p-4 rounded-card bg-bg-surface1 border border-border-default">
          <h3 className="text-sm font-medium text-text-primary mb-4">Source Performance</h3>
          <div className="space-y-3">
            {sourcePerformance.map((sp) => (
              <div key={sp.source}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-secondary">{sourceName(sp.source)}</span>
                  <span className="text-sm font-mono text-text-primary">{sp.avg_score}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-bg-surface2">
                  <div
                    className="h-full rounded-full bg-accent-blue transition-all duration-700"
                    style={{ width: `${(sp.avg_score / maxSourceScore) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trending Keywords */}
      <div className="p-4 rounded-card bg-bg-surface1 border border-border-default">
        <h3 className="text-sm font-medium text-text-primary mb-4">Trending Keywords</h3>
        {["rising", "breakout", "sustained"].map((type) => {
          const items = signals.filter((s) => s.signal_type === type);
          if (items.length === 0) return null;
          const style = SIGNAL_STYLES[type];
          return (
            <div key={type} className="mb-3 last:mb-0">
              <span className={cn("text-xs font-medium uppercase tracking-wider", style.text)}>
                {type === "breakout" ? "⚡" : type === "sustained" ? "🔥" : "●"} {style.label}
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {items.map((s) => (
                  <span
                    key={s.id}
                    className={cn("text-xs px-2.5 py-1 rounded-pill font-medium", style.bg, style.text)}
                  >
                    {s.keyword}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="p-4 rounded-card bg-bg-surface1 border border-border-default">
          <h3 className="text-sm font-medium text-text-primary mb-3">Budget (March 2026)</h3>
          <div className="text-2xl font-mono font-semibold text-text-primary mb-2">
            ${budgetUsed.toFixed(2)} <span className="text-sm text-text-muted font-normal">/ $3.00</span>
          </div>
          <div className="w-full h-3 rounded-full bg-bg-surface2">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((budgetUsed / 3) * 100, 100)}%`,
                background: budgetUsed < 1.8 ? "#22C55E" : budgetUsed < 2.4 ? "#EAB308" : "#EF4444",
              }}
            />
          </div>
          <div className="text-xs text-text-muted mt-1">
            {Math.round((budgetUsed / 3) * 100)}% used
            {budgetUsed < 2.4 ? " · on track ✅" : " · over budget ⚠️"}
          </div>
        </div>

        <div className="p-4 rounded-card bg-bg-surface1 border border-border-default">
          <h3 className="text-sm font-medium text-text-primary mb-3">Pipeline Funnel</h3>
          <div className="space-y-2">
            {[
              { label: "Total Ideas", count: sourcePerformance.reduce((s, sp) => s + sp.count, 0) },
              { label: "BUILD", count: distribution.find((d) => d.verdict === "BUILD")?.count ?? 0 },
              { label: "BET", count: distribution.find((d) => d.verdict === "BET")?.count ?? 0 },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm text-text-secondary w-20">{item.label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-bg-surface2">
                  <div
                    className="h-full rounded-full bg-accent-blue transition-all duration-500"
                    style={{
                      width: `${Math.max((item.count / Math.max(sourcePerformance.reduce((s, sp) => s + sp.count, 0), 1)) * 100, 3)}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-mono text-text-primary w-10 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
