"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VerdictBadge } from "@/components/verdict-badge";
import { ScoreBar } from "@/components/score-bar";
import { SCORE_LABELS } from "@/lib/constants";
import { useIdeas } from "@/hooks/use-ideas";
import type { Idea } from "@/lib/types";
import { X, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

const MAX_COMPARE = 3;

export default function ComparePage() {
  const { ideas, loading } = useIdeas();
  const [selected, setSelected] = useState<number[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const selectedIdeas = selected
    .map((id) => ideas.find((i) => i.id === id))
    .filter(Boolean) as Idea[];

  const available = ideas
    .filter((i) => !selected.includes(i.id))
    .sort((a, b) => b.scoreComposite - a.scoreComposite);

  function addIdea(id: number) {
    if (selected.length < MAX_COMPARE) {
      setSelected([...selected, id]);
      setShowPicker(false);
    }
  }

  function removeIdea(id: number) {
    setSelected(selected.filter((s) => s !== id));
  }

  const scoreKeys = ["market", "automation", "pain", "competition", "willingnessToPay", "margin", "build", "timing"] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Сравнение идей</h1>
        {selected.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setSelected([])}
          >
            Очистить
          </Button>
        )}
      </div>

      {/* Selection bar */}
      <div className="flex items-center gap-3">
        {selectedIdeas.map((idea) => (
          <Badge
            key={idea.id}
            variant="secondary"
            className="gap-1.5 py-1.5 px-3 text-sm"
          >
            {idea.title.slice(0, 30)}
            {idea.title.length > 30 ? "…" : ""}
            <button onClick={() => removeIdea(idea.id)} className="ml-1 hover:text-destructive">
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        {selected.length < MAX_COMPARE && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => setShowPicker(!showPicker)}
          >
            <Plus className="size-3" />
            Добавить идею
          </Button>
        )}
      </div>

      {/* Picker dropdown */}
      {showPicker && (
        <Card>
          <CardContent className="p-3 max-h-[300px] overflow-y-auto space-y-1">
            {available.map((idea) => (
              <button
                key={idea.id}
                onClick={() => addIdea(idea.id)}
                className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm">{idea.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs tabular-nums font-semibold">
                    {idea.scoreComposite.toFixed(1)}
                  </span>
                  <VerdictBadge verdict={idea.verdict} />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Comparison table */}
      {selectedIdeas.length >= 2 && (
        <div className="space-y-4">
          {/* Header row */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${selectedIdeas.length}, 1fr)` }}>
            <div />
            {selectedIdeas.map((idea) => (
              <Card key={idea.id} className="p-4 text-center">
                <Link href={`/ideas/${idea.id}`} className="hover:underline">
                  <p className="text-sm font-semibold">{idea.title}</p>
                </Link>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-2xl font-bold tabular-nums">
                    {idea.scoreComposite.toFixed(1)}
                  </span>
                  <VerdictBadge verdict={idea.verdict} />
                </div>
              </Card>
            ))}
          </div>

          {/* Score rows */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Детализация баллов</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {scoreKeys.map((key) => {
                const values = selectedIdeas.map(
                  (i) => (i.scores[key] as number) || 0
                );
                const max = Math.max(...values);

                return (
                  <div
                    key={key}
                    className="grid gap-4 items-center"
                    style={{
                      gridTemplateColumns: `200px repeat(${selectedIdeas.length}, 1fr)`,
                    }}
                  >
                    <span className="text-sm font-medium">
                      {SCORE_LABELS[key] ?? key}
                    </span>
                    {selectedIdeas.map((idea, idx) => {
                      const val = (idea.scores[key] as number) || 0;
                      const isMax = val === max && values.filter((v) => v === max).length === 1;
                      return (
                        <div key={idea.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <ScoreBar value={val} />
                            <span
                              className={`text-sm tabular-nums font-semibold ml-2 ${
                                isMax ? "text-green-500" : ""
                              }`}
                            >
                              {val.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Details comparison */}
          {selectedIdeas.some((i) => i.detail) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Сравнение деталей</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Проблема", key: "problem" },
                    { label: "Аудитория", key: "targetAudience" },
                    { label: "Ценообразование", key: "pricing" },
                    { label: "Сроки", key: "estimatedTimeline" },
                    { label: "Стоимость", key: "estimatedCost" },
                  ].map((field) => (
                    <div
                      key={field.key}
                      className="grid gap-4"
                      style={{
                        gridTemplateColumns: `200px repeat(${selectedIdeas.length}, 1fr)`,
                      }}
                    >
                      <span className="text-sm font-medium text-muted-foreground">
                        {field.label}
                      </span>
                      {selectedIdeas.map((idea) => (
                        <p key={idea.id} className="text-sm">
                          {(idea.detail as unknown as Record<string, string>)?.[field.key] || "—"}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risks */}
          {selectedIdeas.some((i) => i.scoreReasoning?.risks) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Риски</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: `repeat(${selectedIdeas.length}, 1fr)`,
                  }}
                >
                  {selectedIdeas.map((idea) => (
                    <div key={idea.id} className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        {idea.title.slice(0, 25)}…
                      </p>
                      {(idea.scoreReasoning?.risks || []).map(
                        (risk: string, i: number) => (
                          <p key={i} className="text-sm text-muted-foreground">
                            • {risk}
                          </p>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Winner */}
          {selectedIdeas.length >= 2 && (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold flex items-center gap-2">
                    Лидер:{" "}
                    {selectedIdeas.reduce((a, b) =>
                      a.scoreComposite >= b.scoreComposite ? a : b
                    ).title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Общий балл:{" "}
                    {selectedIdeas
                      .reduce((a, b) =>
                        a.scoreComposite >= b.scoreComposite ? a : b
                      )
                      .scoreComposite.toFixed(1)}
                  </p>
                </div>
                <Link
                  href={`/ideas/${
                    selectedIdeas.reduce((a, b) =>
                      a.scoreComposite >= b.scoreComposite ? a : b
                    ).id
                  }/workspace`}
                >
                  <Button size="sm" className="gap-1.5">
                    Открыть воркспейс <ArrowRight className="size-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {selectedIdeas.length < 2 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="text-sm">Выбери минимум 2 идеи для сравнения</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
