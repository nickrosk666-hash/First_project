"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VerdictBadge } from "@/components/verdict-badge";
import { IdeaActions } from "@/components/idea-actions";
import { HuntDialog } from "@/components/hunt-dialog";
import { CheckDialog } from "@/components/check-dialog";
import { HuntHistory } from "@/components/hunt-history";
import { useIdeas } from "@/hooks/use-ideas";
import type { Idea, Verdict } from "@/lib/types";

type VerdictFilter = Verdict | "all";

const VERDICT_FILTER_LABELS: Record<VerdictFilter, string> = {
  all: "Все",
  BUILD: "BUILD",
  BET: "BET",
  FLIP: "FLIP",
  KILL: "KILL",
};

export default function IdeasPage() {
  const [verdictFilter, setVerdictFilter] = useState<VerdictFilter>("all");
  const [sortDesc, setSortDesc] = useState(true);
  const { ideas, loading, source, reload } = useIdeas();
  const [localIdeas, setLocalIdeas] = useState<Idea[] | null>(null);

  const list = localIdeas ?? ideas;

  const filtered = list
    .filter((i) => verdictFilter === "all" || i.verdict === verdictFilter)
    .sort((a, b) =>
      sortDesc
        ? b.scoreComposite - a.scoreComposite
        : a.scoreComposite - b.scoreComposite
    );

  const verdicts: VerdictFilter[] = ["all", "BUILD", "BET", "FLIP", "KILL"];

  function handleUpdate(updated: Idea) {
    const base = localIdeas ?? ideas;
    if (updated.deletedAt) {
      setLocalIdeas(base.filter((i) => i.id !== updated.id));
    } else {
      setLocalIdeas(base.map((i) => (i.id === updated.id ? updated : i)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Идеи</h1>
        <div className="flex items-center gap-2">
          <HuntDialog onComplete={() => { setLocalIdeas(null); reload(); }} />
          <CheckDialog onComplete={() => { setLocalIdeas(null); reload(); }} />
          {!loading && (
            <span className="text-xs text-muted-foreground">
              {source === "live" ? `${ideas.length} идей` : `mock-данные`}
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {verdicts.map((v) => (
          <Button
            key={v}
            variant={verdictFilter === v ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setVerdictFilter(v)}
          >
            {VERDICT_FILTER_LABELS[v]}
          </Button>
        ))}
      </div>

      {/* Hunt history */}
      <HuntHistory />

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead
                className="w-28 cursor-pointer select-none text-right whitespace-nowrap"
                onClick={() => setSortDesc(!sortDesc)}
              >
                Балл {sortDesc ? "↓" : "↑"}
              </TableHead>
              <TableHead className="w-24">Вердикт</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((idea) => (
              <TableRow key={idea.id}>
                <TableCell className="py-3">
                  <Link
                    href={`/ideas/${idea.id}`}
                    className="font-semibold hover:underline leading-snug"
                  >
                    {idea.isFavorite && <span className="text-amber-500 mr-1">★</span>}
                    {idea.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-1 leading-snug">
                    {idea.verdictReason}
                  </p>
                </TableCell>
                <TableCell className="text-right tabular-nums font-semibold text-base whitespace-nowrap">
                  {idea.scoreComposite.toFixed(1)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <VerdictBadge verdict={idea.verdict} />
                </TableCell>
                <TableCell className="py-2">
                  <IdeaActions idea={idea} onUpdate={handleUpdate} size="sm" />
                </TableCell>
              </TableRow>
            ))}
            {loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Загрузка идей...
                </TableCell>
              </TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Нет идей по выбранному фильтру.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
