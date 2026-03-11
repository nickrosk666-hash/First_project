"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number;
  formatType?: "currency" | "integer";
  delta?: number;
  suffix?: string;
  icon?: React.ReactNode;
  progress?: { current: number; max: number };
}

function formatValue(v: number, type?: "currency" | "integer"): string {
  if (type === "currency") return `$${v.toFixed(2)}`;
  return Math.round(v).toString();
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();
    let raf: number;

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setValue(current);

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        ref.current = target;
      }
    }

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export default function StatCard({ label, value, formatType, delta, suffix, icon, progress }: StatCardProps) {
  const animatedValue = useCountUp(value);
  const displayValue = formatValue(animatedValue, formatType);

  return (
    <div className="p-4 rounded-card bg-bg-surface1 border border-border-default hover:border-border-hover transition-colors duration-150">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-text-muted uppercase tracking-wider">{label}</span>
        {icon && <span className="text-text-muted">{icon}</span>}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-mono font-semibold text-text-primary">{displayValue}</span>
        {suffix && <span className="text-sm text-text-muted">{suffix}</span>}
      </div>

      {delta != null && (
        <div className={cn(
          "text-xs font-mono mt-1",
          delta > 0 ? "text-verdict-build" : delta < 0 ? "text-verdict-kill" : "text-text-muted"
        )}>
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "="} {delta > 0 ? "+" : ""}{delta}
        </div>
      )}

      {progress && (
        <div className="mt-3">
          <div className="w-full h-1.5 rounded-full bg-bg-surface2">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((progress.current / progress.max) * 100, 100)}%`,
                background: progress.current / progress.max < 0.6
                  ? "#22C55E"
                  : progress.current / progress.max < 0.8
                    ? "#EAB308"
                    : "#EF4444",
              }}
            />
          </div>
          <div className="text-[11px] text-text-muted font-mono mt-1">
            {formatValue(progress.current, formatType)} / {formatValue(progress.max, formatType)}
          </div>
        </div>
      )}
    </div>
  );
}
