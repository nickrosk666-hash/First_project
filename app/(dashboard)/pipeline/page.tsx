"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerdictBadge } from "@/components/verdict-badge";
import { useIdeas } from "@/hooks/use-ideas";
import type { Idea, IdeaStatus } from "@/lib/types";

const STAGES: { key: IdeaStatus | "all_scored"; label: string; color: string; description: string }[] = [
  { key: "all_scored", label: "Найдено", color: "border-t-zinc-500", description: "Идеи из поиска" },
  { key: "validated", label: "Проверено", color: "border-t-blue-500", description: "Прошли глубокую проверку" },
  { key: "building", label: "В работе", color: "border-t-amber-500", description: "Воркспейс создан" },
  { key: "launched", label: "Запущено", color: "border-t-green-500", description: "Продукт запущен" },
];

function getStageIdeas(ideas: Idea[], stageKey: string): Idea[] {
  if (stageKey === "all_scored") {
    return ideas.filter(
      (i) => i.status === "raw" || i.status === "scored" || i.status === "pending_scoring"
    );
  }
  return ideas.filter((i) => i.status === stageKey);
}

export default function PipelinePage() {
  const { ideas, loading } = useIdeas();
  const [draggedId, setDraggedId] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Загрузка...
      </div>
    );
  }

  async function moveIdea(ideaId: number, newStatus: string) {
    const status = newStatus === "all_scored" ? "scored" : newStatus;
    try {
      await fetch(`/api/ideas/${ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      window.location.reload();
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <span className="text-xs text-muted-foreground">
          {ideas.length} идей
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAGES.map((stage) => {
          const stageIdeas = getStageIdeas(ideas, stage.key);
          return (
            <div
              key={stage.key}
              className="space-y-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedId !== null) {
                  moveIdea(draggedId, stage.key);
                  setDraggedId(null);
                }
              }}
            >
              {/* Column header */}
              <div className={`rounded-lg border border-t-4 ${stage.color} p-3`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{stage.label}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {stageIdeas.length}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {stage.description}
                </p>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-[100px]">
                {stageIdeas
                  .sort((a, b) => b.scoreComposite - a.scoreComposite)
                  .map((idea) => (
                    <Card
                      key={idea.id}
                      draggable
                      onDragStart={() => setDraggedId(idea.id)}
                      onDragEnd={() => setDraggedId(null)}
                      className={`p-3 cursor-grab active:cursor-grabbing transition-opacity ${
                        draggedId === idea.id ? "opacity-50" : ""
                      }`}
                    >
                      <Link href={`/ideas/${idea.id}`} className="block">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-snug hover:underline">
                            {idea.isFavorite && (
                              <span className="text-amber-500 mr-1">★</span>
                            )}
                            {idea.title}
                          </p>
                          <span className="text-xs font-bold tabular-nums shrink-0">
                            {idea.scoreComposite.toFixed(1)}
                          </span>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2 mt-2">
                        <VerdictBadge verdict={idea.verdict} />
                        {idea.source && (
                          <span className="text-xs text-muted-foreground">
                            {idea.source}
                          </span>
                        )}
                      </div>
                      {idea.verdictReason && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-snug">
                          {idea.verdictReason}
                        </p>
                      )}
                    </Card>
                  ))}
                {stageIdeas.length === 0 && (
                  <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Пусто
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
