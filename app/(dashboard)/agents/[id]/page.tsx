import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/status-dot";
import { ScoreBar } from "@/components/score-bar";
import { AGENT_TYPE_LABELS, STATUS_LABELS } from "@/lib/constants";
import { mockAgents } from "@/lib/mock-data";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = mockAgents.find((a) => a.id === id);
  if (!agent) return notFound();

  const metrics = [
    { label: "Tasks Completed", value: agent.metrics.tasksCompleted },
    { label: "Error Rate", value: `${(agent.metrics.errorRate * 100).toFixed(1)}%` },
    { label: "Uptime", value: `${agent.metrics.uptimePercent.toFixed(1)}%` },
    { label: "Cost", value: `$${agent.metrics.costUsd.toFixed(2)}` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/agents">
          <Button variant="ghost" size="icon" className="size-8">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <StatusDot status={agent.status} className="size-2.5" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {agent.name}
          </h1>
        </div>
        <span className="text-sm text-muted-foreground">
          {AGENT_TYPE_LABELS[agent.type]} · {STATUS_LABELS[agent.status]}
        </span>
      </div>

      {/* Metrics grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {m.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* GitHub repo link */}
      {agent.githubRepo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Linked Repository</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/code?repo=${agent.githubRepo}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="size-3.5" />
              {agent.githubRepo}
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Uptime</p>
            <ScoreBar value={agent.metrics.uptimePercent / 10} />
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">
              Error Rate (inverted)
            </p>
            <ScoreBar value={10 - agent.metrics.errorRate * 100} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
