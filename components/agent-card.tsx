import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { StatusDot } from "@/components/status-dot";
import { AGENT_TYPE_LABELS, STATUS_LABELS } from "@/lib/constants";
import type { Agent } from "@/lib/types";

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Link href={`/agents/${agent.id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <StatusDot status={agent.status} />
              <span className="text-sm font-medium">{agent.name}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {AGENT_TYPE_LABELS[agent.type]}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {STATUS_LABELS[agent.status]} &middot; {agent.metrics.tasksCompleted}{" "}
              задач
            </span>
            <span className="tabular-nums">
              ${agent.metrics.costUsd.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
