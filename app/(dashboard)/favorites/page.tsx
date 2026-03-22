"use client";

import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
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
import { useIdeas } from "@/hooks/use-ideas";
import type { Idea } from "@/lib/types";

export default function FavoritesPage() {
  const { ideas, loading } = useIdeas("favorites");
  const [localIdeas, setLocalIdeas] = useState<Idea[] | null>(null);

  const list = localIdeas ?? ideas;

  function handleUpdate(updated: Idea) {
    const base = localIdeas ?? ideas;
    if (!updated.isFavorite || updated.deletedAt) {
      setLocalIdeas(base.filter((i) => i.id !== updated.id));
    } else {
      setLocalIdeas(base.map((i) => (i.id === updated.id ? updated : i)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Star className="size-5 text-amber-500 fill-amber-500" />
        <h1 className="text-2xl font-semibold tracking-tight">Избранное</h1>
        {!loading && (
          <span className="text-xs text-muted-foreground ml-auto">
            {list.length} идей
          </span>
        )}
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead className="w-28 text-right whitespace-nowrap">Балл</TableHead>
              <TableHead className="w-24">Вердикт</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((idea) => (
              <TableRow key={idea.id}>
                <TableCell className="py-3">
                  <Link href={`/ideas/${idea.id}`} className="font-semibold hover:underline leading-snug">
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
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Загрузка...
                </TableCell>
              </TableRow>
            )}
            {!loading && list.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Нет избранных идей. Нажми ★ на любой идее чтобы добавить.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
