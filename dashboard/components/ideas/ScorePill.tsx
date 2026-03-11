"use client";

import { cn } from "@/lib/utils";
import type { Verdict } from "@/types/idea";

interface ScorePillProps {
  score: number;
  verdict: Verdict;
  size?: "sm" | "md" | "lg";
}

const verdictColors: Record<Verdict, { text: string; bg: string }> = {
  BUILD: { text: "text-verdict-build", bg: "bg-verdict-build/10" },
  BET: { text: "text-verdict-bet", bg: "bg-verdict-bet/10" },
  FLIP: { text: "text-verdict-flip", bg: "bg-verdict-flip/10" },
  KILL: { text: "text-verdict-kill", bg: "bg-verdict-kill/10" },
};

const sizes = {
  sm: "w-10 h-10 text-sm",
  md: "w-12 h-12 text-lg",
  lg: "w-16 h-16 text-2xl",
};

export default function ScorePill({ score, verdict, size = "md" }: ScorePillProps) {
  const colors = verdictColors[verdict];

  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl shrink-0", colors.bg, sizes[size])}>
      <span className={cn("font-mono font-bold leading-none", colors.text)}>
        {score.toFixed(1)}
      </span>
      <span className={cn("text-[9px] font-semibold uppercase tracking-wider leading-none mt-0.5", colors.text)}>
        {verdict}
      </span>
    </div>
  );
}
