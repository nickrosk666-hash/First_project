"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { use, useState, useEffect } from "react";
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
  RefreshCw,
  Hammer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VerdictBadge } from "@/components/verdict-badge";
import { ScoreBar } from "@/components/score-bar";
import { LaunchButton } from "@/components/launch-button";
import { IdeaChat } from "@/components/idea-chat";
import { IdeaActions } from "@/components/idea-actions";
import { CheckDialog } from "@/components/check-dialog";
import { SOURCE_LABELS, SCORE_LABELS } from "@/lib/constants";
import { useIdea } from "@/hooks/use-ideas";
import type { Idea } from "@/lib/types";

export default function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { idea: fetchedIdea, loading } = useIdea(Number(id));
  const [rescoredIdea, setRescoredIdea] = useState<Idea | null>(null);
  const [rescoring, setRescoring] = useState(false);
  const [rescoreError, setRescoreError] = useState<string | null>(null);

  // Reset rescored idea when navigating to a different idea
  useEffect(() => { setRescoredIdea(null); }, [id]);

  async function rescore() {
    const current = rescoredIdea ?? fetchedIdea;
    if (!current) return;
    setRescoring(true);
    setRescoreError(null);
    try {
      const res = await fetch(`/api/ideas/${current.id}/rescore`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        setRescoreError(err.error ?? "Ошибка переоценки");
      } else {
        setRescoredIdea(await res.json());
      }
    } catch (e) {
      setRescoreError(String(e));
    } finally {
      setRescoring(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Загрузка...
      </div>
    );
  }

  const idea = rescoredIdea ?? fetchedIdea;
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
        <div className="flex items-center gap-2">
          <Link href={`/ideas/${idea.id}/workspace`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Hammer className="size-3.5" />
              Воркспейс
            </Button>
          </Link>
          <CheckDialog
            prefillTitle={idea.title}
            prefillDescription={idea.description}
            ideaId={idea.id}
            triggerLabel="Глубокая проверка"
            onComplete={() => window.location.reload()}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={rescore}
            disabled={rescoring}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`size-3.5 ${rescoring ? "animate-spin" : ""}`} />
            {rescoring ? "Анализирую..." : "Переоценить"}
          </Button>
          <IdeaActions idea={idea} />
          {canLaunch && (
            <LaunchButton
              idea={idea}
              disabled={idea.status === "building"}
            />
          )}
        </div>
      </div>

      {/* Rescore error */}
      {rescoreError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {rescoreError}
        </div>
      )}

      {/* Rescoring overlay hint */}
      {rescoring && (
        <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Sonnet исследует рынок США/Канады/Австралии... Это займёт ~30 секунд.
        </div>
      )}

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

          {/* Chat with agent */}
          <IdeaChat ideaId={idea.id} />

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

      {/* Chat — shown for ideas without detail */}
      {!detail && <IdeaChat ideaId={idea.id} />}

      {/* Score breakdown — always shown */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Детализация оценки</CardTitle>
            {!idea.scoreReasoning && (
              <span className="text-xs text-muted-foreground italic">
                Нажми «Переоценить» для глубокого анализа Sonnet
              </span>
            )}
            {idea.scoreReasoning && (
              <span className="text-xs text-green-500">✓ Глубокий анализ (Sonnet)</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {scoreEntries.map(([key, value]) => {
            const reasoning = idea.scoreReasoning?.[key];
            return (
              <div key={key}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {SCORE_LABELS[key] ?? key}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {typeof value === 'number' ? value.toFixed(1) : value}/10
                  </span>
                </div>
                <ScoreBar value={value as number} />
                {reasoning?.reason && (
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {reasoning.reason}
                  </p>
                )}
              </div>
            );
          })}
          {idea.scoreReasoning?.risks && idea.scoreReasoning.risks.length > 0 && (
            <div className="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-1">
              <p className="text-xs font-semibold text-destructive">Ключевые риски</p>
              {idea.scoreReasoning.risks.map((risk: string, i: number) => (
                <p key={i} className="text-sm text-muted-foreground">• {risk}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
