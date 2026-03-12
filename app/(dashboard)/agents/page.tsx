"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/agent-card";
import { mockAgents } from "@/lib/mock-data";
import type { AgentStatus, AgentType } from "@/lib/types";

type FilterStatus = AgentStatus | "all";
type FilterType = AgentType | "all";

const STATUS_FILTER_LABELS: Record<FilterStatus, string> = {
  all: "Все",
  running: "Работают",
  paused: "Пауза",
  idle: "Ожидание",
  error: "Ошибки",
  stopped: "Остановлены",
};

const TYPE_FILTER_LABELS: Record<FilterType, string> = {
  all: "Все",
  discovery: "Поиск",
  validator: "Валидация",
  builder: "Сборка",
  launcher: "Запуск",
  operator: "Управление",
};

export default function AgentsPage() {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");

  const filtered = mockAgents.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    return true;
  });

  const statuses: FilterStatus[] = ["all", "running", "paused", "idle", "error", "stopped"];
  const types: FilterType[] = ["all", "discovery", "validator", "builder", "launcher", "operator"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Агенты</h1>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Новый агент
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setStatusFilter(s)}
          >
            {STATUS_FILTER_LABELS[s]}
          </Button>
        ))}
        <span className="mx-1 self-center text-border">|</span>
        {types.map((t) => (
          <Button
            key={t}
            variant={typeFilter === t ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setTypeFilter(t)}
          >
            {TYPE_FILTER_LABELS[t]}
          </Button>
        ))}
      </div>

      {/* Agent grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Нет агентов по выбранным фильтрам.
        </p>
      )}
    </div>
  );
}
