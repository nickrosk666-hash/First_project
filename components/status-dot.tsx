import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/lib/types";

const statusColorMap: Record<AgentStatus, string> = {
  running: "bg-status-running",
  paused: "bg-status-paused",
  error: "bg-status-error",
  idle: "bg-status-idle",
  stopped: "bg-status-idle",
};

export function StatusDot({
  status,
  className,
}: {
  status: AgentStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block size-2 rounded-full shrink-0",
        statusColorMap[status],
        status === "running" && "animate-pulse",
        className
      )}
      aria-label={status}
    />
  );
}
