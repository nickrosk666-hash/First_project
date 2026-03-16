"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Target,
  Puzzle,
  Zap,
  DollarSign,
  Clock,
  Users,
  Layers,
  CircleDot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VerdictBadge } from "@/components/verdict-badge";
import { ScoreBar } from "@/components/score-bar";
import { LaunchButton } from "@/components/launch-button";
import { SOURCE_LABELS, SCORE_LABELS } from "@/lib/constants";
import { useIdea } from "@/hooks/use-ideas";

export default function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { idea, loading } = useIdea(Number(id));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Загрузка...
      </div>
    );
  }

  if (!idea) return notFound();

  const scoreEntries = Object.entries(idea.scores) as [string, number][];
  const detail = idea.detail;
  const canLaunch = idea.verdict === "BUILD" || idea.verdict === "BET";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/ideas">
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{idea.title}</h1>
          <VerdictBadge verdict={idea.verdict} />
        </div>
        {canLaunch && (
          <LaunchButton
            idea={idea}
            disabled={idea.status === "building"}
          />
        )}
      </div>

      {/* Summary card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">{idea.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>
              Источник: {SOURCE_LABELS[idea.source] ?? idea.source}
            </span>
            <span>
              Общий балл: <strong className="text-foreground">{idea.scoreComposite.toFixed(1)}</strong>
            </span>
            <span>Статус: {idea.status}</span>
            {idea.sourceUrl && (
              <a
                href={idea.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <ExternalLink className="size-3" />
                Оригинал
              </a>
            )}
          </div>
          <div className="rounded-md bg-muted/50 p-3 text-sm">
            <span className="text-xs font-medium text-muted-foreground">Вердикт Claude:</span>
            <p className="mt-1">{idea.verdictReason}</p>
          </div>
        </CardContent>
      </Card>

      {/* Detailed breakdown — only if detail exists */}
      {detail && (
        <>
          {/* Problem & Value */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="size-4 text-verdict-kill" />
                  Проблема
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{detail.problem}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Zap className="size-4 text-verdict-build" />
                  Ценность для людей
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{detail.valueProposition}</p>
              </CardContent>
            </Card>
          </div>

          {/* Audience, Pricing, Timeline */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Users className="size-3.5" />
                  Целевая аудитория
                </div>
                <p className="text-sm">{detail.targetAudience}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <DollarSign className="size-3.5" />
                  Ценообразование
                </div>
                <p className="text-sm">{detail.pricing}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Clock className="size-3.5" />
                  Сроки и бюджет
                </div>
                <p className="text-sm">{detail.estimatedTimeline}</p>
                <p className="text-xs text-muted-foreground mt-1">Расходы: {detail.estimatedCost}</p>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Puzzle className="size-4 text-verdict-bet" />
                Из чего состоит продукт
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {detail.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CircleDot className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tech Stack */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Layers className="size-4 text-muted-foreground" />
                Технологический стек
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {detail.techStack.map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Launch Steps */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Как запустить — пошагово</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {detail.launchSteps.map((ls) => (
                  <div key={ls.step} className="flex gap-4">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {ls.step}
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm font-medium">{ls.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        {ls.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Launch CTA at the bottom */}
          {canLaunch && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
              <div>
                <p className="text-sm font-medium">Готов запустить этот проект?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Агент-строитель создаст репозиторий, сгенерирует MVP и задеплоит автоматически.
                </p>
              </div>
              <LaunchButton
                idea={idea}
                disabled={idea.status === "building"}
              />
            </div>
          )}
        </>
      )}

      {/* Score breakdown — always shown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Детализация оценки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {scoreEntries.map(([key, value]) => (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {SCORE_LABELS[key] ?? key}
                </span>
              </div>
              <ScoreBar value={value} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
