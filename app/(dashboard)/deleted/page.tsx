"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { VerdictBadge } from "@/components/verdict-badge";
import { IdeaActions } from "@/components/idea-actions";
import { SOURCE_LABELS } from "@/lib/constants";
import { useIdeas } from "@/hooks/use-ideas";
import type { Idea } from "@/lib/types";

function daysLeft(deletedAt: string) {
  const deleted = new Date(deletedAt).getTime();
  const purgeAt = deleted + 7 * 24 * 60 * 60 * 1000;
  const diff = purgeAt - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export default function DeletedPage() {
  const { ideas, loading } = useIdeas("deleted");
  const [localIdeas, setLocalIdeas] = useState<Idea[] | null>(null);

  const list = localIdeas ?? ideas;

  function handleUpdate(updated: Idea) {
    const base = localIdeas ?? ideas;
    // restored → remove from deleted list
    if (!updated.deletedAt) {
      setLocalIdeas(base.filter((i) => i.id !== updated.id));
    } else {
      setLocalIdeas(base.map((i) => (i.id === updated.id ? updated : i)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trash2 className="size-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight">Удалённые</h1>
        {!loading && (
          <span className="text-xs text-muted-foreground ml-auto">
            {list.length} идей
          </span>
        )}
      </div>

      {list.length > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <Clock className="size-3.5 shrink-0" />
          Идеи автоматически удаляются безвозвратно через 7 дней после удаления.
        </div>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead className="w-24">Источник</TableHead>
              <TableHead className="w-20 text-right">Балл</TableHead>
              <TableHead className="w-20">Вердикт</TableHead>
              <TableHead className="w-24 text-center">Дней осталось</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((idea) => {
              const days = idea.deletedAt ? daysLeft(idea.deletedAt) : 7;
              return (
                <TableRow key={idea.id} className="opacity-70">
                  <TableCell>
                    <Link href={`/ideas/${idea.id}`} className="font-medium hover:underline line-through decoration-muted-foreground/40">
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
                  <TableCell className="text-center">
                    <span className={`text-xs font-medium ${days <= 1 ? "text-destructive" : days <= 3 ? "text-amber-500" : "text-muted-foreground"}`}>
                      {days}д
                    </span>
                  </TableCell>
                  <TableCell>
                    <IdeaActions idea={idea} onUpdate={handleUpdate} showRestore size="sm" />
                  </TableCell>
                </TableRow>
              );
            })}
            {loading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Загрузка...
                </TableCell>
              </TableRow>
            )}
            {!loading && list.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Нет удалённых идей.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
