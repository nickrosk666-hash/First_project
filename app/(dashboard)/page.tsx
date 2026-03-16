"use client";

import { Bot, Lightbulb, Hammer, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { StatusDot } from "@/components/status-dot";
import { VerdictBadge } from "@/components/verdict-badge";
import { STATUS_LABELS } from "@/lib/constants";
import { mockAgents, mockCosts } from "@/lib/mock-data";
import { useIdeas } from "@/hooks/use-ideas";

const recentAgents = mockAgents.slice(0, 4);

export default function OverviewPage() {
  const { ideas, loading, source } = useIdeas();

  const topIdeas = ideas
    .filter((i) => i.scoreComposite >= 7)
    .sort((a, b) => b.scoreComposite - a.scoreComposite)
    .slice(0, 5);

  const stats = [
    { label: "Агенты", value: mockAgents.length, icon: Bot },
    { label: "Идей найдено", value: loading ? "…" : ideas.length, icon: Lightbulb },
    { label: "BUILD", value: loading ? "…" : ideas.filter((i) => i.verdict === "BUILD").length, icon: Hammer },
    { label: "Расходы/мес", value: `$${mockCosts[mockCosts.length - 1]?.costUsd.toFixed(2)}`, icon: DollarSign },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Обзор</h1>
        {!loading && (
          <span className="text-xs text-muted-foreground">
            {source === "live" ? "🟢 Живые данные из n8n" : "⚪ Mock-данные (n8n не запущен)"}
          </span>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                <stat.icon className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top ideas */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Лучшие идеи</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead className="w-20 text-right">Балл</TableHead>
                <TableHead className="w-20">Вердикт</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Загрузка...
                  </TableCell>
                </TableRow>
              )}
              {!loading && topIdeas.map((idea) => (
                <TableRow key={idea.id}>
                  <TableCell className="font-medium">
                    <Link href={`/ideas/${idea.id}`} className="hover:underline">
                      {idea.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {idea.scoreComposite.toFixed(1)}
                  </TableCell>
                  <TableCell>
                    <VerdictBadge verdict={idea.verdict} />
                  </TableCell>
                </TableRow>
              ))}
              {!loading && topIdeas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    Пока нет идей с баллом выше 7.0.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Agent activity */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Активность агентов</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Агент</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Задачи</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <StatusDot status={agent.status} />
                      <span className="font-medium">{agent.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {STATUS_LABELS[agent.status]}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {agent.metrics.tasksCompleted}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
