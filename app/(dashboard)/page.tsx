"use client";

import { useState, useEffect } from "react";
import {
  Lightbulb,
  Hammer,
  Search,
  TrendingUp,
  Clock,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { VerdictBadge } from "@/components/verdict-badge";
import { HuntDialog } from "@/components/hunt-dialog";
import { useIdeas } from "@/hooks/use-ideas";

interface HuntJob {
  status: string;
  ideas_created: number;
  created_at: string;
  result: { totalResults?: number; candidates?: number; saved?: number } | null;
}

export default function OverviewPage() {
  const { ideas, loading, source, reload } = useIdeas();
  const [lastHunt, setLastHunt] = useState<HuntJob | null>(null);
  const [huntLoading, setHuntLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hunt/history")
      .then((r) => r.json())
      .then((data) => {
        if (data.jobs?.length > 0) setLastHunt(data.jobs[0]);
      })
      .catch(() => {})
      .finally(() => setHuntLoading(false));
  }, []);

  const topIdeas = ideas
    .filter((i) => i.scoreComposite >= 7)
    .sort((a, b) => b.scoreComposite - a.scoreComposite)
    .slice(0, 5);

  const buildCount = ideas.filter((i) => i.verdict === "BUILD").length;
  const betCount = ideas.filter((i) => i.verdict === "BET").length;
  const buildingCount = ideas.filter((i) => i.status === "building").length;
  const validatedCount = ideas.filter((i) => i.status === "validated").length;

  const lastHuntDate = lastHunt?.created_at ? new Date(lastHunt.created_at) : null;
  const lastHuntAgo = lastHuntDate
    ? Math.round((Date.now() - lastHuntDate.getTime()) / (1000 * 60 * 60))
    : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Обзор</h1>
        <div className="flex items-center gap-2">
          <HuntDialog onComplete={reload} />
          {!loading && (
            <span className="text-xs text-muted-foreground">
              {source === "live" ? `${ideas.length} идей в базе` : "mock-данные"}
            </span>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <Lightbulb className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? "…" : ideas.length}
              </p>
              <p className="text-xs text-muted-foreground">Всего идей</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-green-500/10">
              <TrendingUp className="size-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? "…" : buildCount}
              </p>
              <p className="text-xs text-muted-foreground">
                BUILD{betCount > 0 ? ` + ${betCount} BET` : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-blue-500/10">
              <Hammer className="size-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {loading ? "…" : buildingCount}
              </p>
              <p className="text-xs text-muted-foreground">
                В разработке{validatedCount > 0 ? ` / ${validatedCount} готовы` : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <Search className="size-5 text-muted-foreground" />
            </div>
            <div>
              {huntLoading ? (
                <p className="text-2xl font-semibold">…</p>
              ) : lastHunt ? (
                <p className="text-2xl font-semibold tabular-nums">
                  {lastHuntAgo !== null
                    ? lastHuntAgo < 1
                      ? "< 1ч"
                      : lastHuntAgo < 24
                      ? `${lastHuntAgo}ч`
                      : `${Math.round(lastHuntAgo / 24)}д`
                    : "—"}
                </p>
              ) : (
                <p className="text-2xl font-semibold">—</p>
              )}
              <p className="text-xs text-muted-foreground">
                {lastHunt
                  ? `Последний поиск${lastHunt.ideas_created > 0 ? ` (+${lastHunt.ideas_created})` : ""}`
                  : "Поиск не запускался"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            {[
              { label: "Найдено", count: ideas.filter(i => i.status === "raw" || i.status === "scored").length, color: "bg-muted" },
              { label: "Проверено", count: validatedCount, color: "bg-blue-500/20" },
              { label: "В работе", count: buildingCount, color: "bg-amber-500/20" },
              { label: "Запущено", count: ideas.filter(i => i.status === "launched").length, color: "bg-green-500/20" },
            ].map((stage, i, arr) => (
              <div key={stage.label} className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`flex-1 rounded-lg ${stage.color} px-4 py-3 text-center`}>
                  <p className="text-xl font-bold tabular-nums">{loading ? "…" : stage.count}</p>
                  <p className="text-xs text-muted-foreground">{stage.label}</p>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top ideas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Лучшие идеи (7+)</h2>
          <Link href="/ideas">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              Все идеи <ArrowRight className="size-3" />
            </Button>
          </Link>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead className="w-20">Статус</TableHead>
                <TableHead className="w-20 text-right">Балл</TableHead>
                <TableHead className="w-20">Вердикт</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Загрузка...
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                topIdeas.map((idea) => (
                  <TableRow key={idea.id}>
                    <TableCell className="font-medium">
                      <Link href={`/ideas/${idea.id}`} className="hover:underline">
                        {idea.isFavorite && (
                          <span className="text-amber-500 mr-1">★</span>
                        )}
                        {idea.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {idea.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">
                      {idea.scoreComposite.toFixed(1)}
                    </TableCell>
                    <TableCell>
                      <VerdictBadge verdict={idea.verdict} />
                    </TableCell>
                  </TableRow>
                ))}
              {!loading && topIdeas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Нет идей с баллом 7+.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Last hunt details */}
      {lastHunt && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="size-4" />
            Последний поиск
          </h2>
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-3.5" />
                  {lastHuntDate?.toLocaleDateString("ru-RU")}{" "}
                  {lastHuntDate?.toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {lastHunt.result && (
                  <>
                    <Badge variant="secondary">
                      {lastHunt.result.totalResults || 0} источников
                    </Badge>
                    <Badge variant="secondary">
                      {lastHunt.result.candidates || 0} кандидатов
                    </Badge>
                    <Badge variant={lastHunt.ideas_created > 0 ? "default" : "secondary"}>
                      +{lastHunt.ideas_created} сохранено
                    </Badge>
                  </>
                )}
                <Badge
                  variant={lastHunt.status === "complete" ? "secondary" : "destructive"}
                  className="text-xs"
                >
                  {lastHunt.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
