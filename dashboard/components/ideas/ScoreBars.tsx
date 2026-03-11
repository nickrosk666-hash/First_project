"use client";

import { cn, scoreToColor, scoreToBarColor } from "@/lib/utils";
import { SCORE_LABELS } from "@/lib/constants";
import type { Idea } from "@/types/idea";

interface ScoreBarsProps {
  idea: Idea;
}

const FIELDS = [
  "score_market", "score_automation", "score_pain_level", "score_competition",
  "score_willingness_to_pay", "score_margin", "score_build", "score_timing",
] as const;

export default function ScoreBars({ idea }: ScoreBarsProps) {
  return (
    <div className="space-y-3">
      {FIELDS.map((field) => {
        const val = idea[field];
        if (val == null) return null;
        const info = SCORE_LABELS[field];

        return (
          <div key={field}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-text-secondary">{info?.full ?? field}</span>
              <span className={cn("text-sm font-mono font-medium", scoreToColor(val))}>
                {val}/10
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-bg-surface2">
              <div
                className={cn("h-full rounded-full transition-all duration-700", scoreToBarColor(val))}
                style={{ width: `${(val / 10) * 100}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
