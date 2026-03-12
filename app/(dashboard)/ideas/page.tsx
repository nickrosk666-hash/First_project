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
import { SOURCE_LABELS } from "@/lib/constants";
import { mockIdeas } from "@/lib/mock-data";
import type { Verdict } from "@/lib/types";

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

  const filtered = mockIdeas
    .filter((i) => verdictFilter === "all" || i.verdict === verdictFilter)
    .sort((a, b) =>
      sortDesc
        ? b.scoreComposite - a.scoreComposite
        : a.scoreComposite - b.scoreComposite
    );

  const verdicts: VerdictFilter[] = ["all", "BUILD", "BET", "FLIP", "KILL"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Идеи</h1>

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

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead className="w-24">Источник</TableHead>
              <TableHead
                className="w-20 cursor-pointer select-none text-right"
                onClick={() => setSortDesc(!sortDesc)}
              >
                Балл {sortDesc ? "\u2193" : "\u2191"}
              </TableHead>
              <TableHead className="w-20">Вердикт</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((idea) => (
              <TableRow key={idea.id}>
                <TableCell>
                  <Link
                    href={`/ideas/${idea.id}`}
                    className="font-medium hover:underline"
                  >
                    {idea.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {idea.verdictReason}
                  </p>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {SOURCE_LABELS[idea.source] ?? idea.source}
                </TableCell>
                <TableCell className="text-right tabular-nums font-medium">
                  {idea.scoreComposite.toFixed(1)}
                </TableCell>
                <TableCell>
                  <VerdictBadge verdict={idea.verdict} />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
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
