import { cn } from "@/lib/utils";

export function ScoreBar({
  value,
  max = 10,
  className,
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const color =
    value >= 7 ? "bg-verdict-build" : value >= 5 ? "bg-verdict-flip" : "bg-verdict-kill";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 flex-1 rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-6 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
}
