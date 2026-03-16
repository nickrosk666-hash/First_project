"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Rocket,
  ExternalLink,
  FolderOpen,
  Globe,
  CreditCard,
  Megaphone,
  CheckCircle2,
  Package,
  Clock,
  Code2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Launch {
  id: number;
  ideaId: number;
  ideaTitle: string;
  productName: string;
  tagline: string;
  slug: string;
  status: string;
  projectDir: string;
  generatedAt: string;
  domain?: string;
}

const SELL_STEPS = [
  {
    icon: ExternalLink,
    title: "Открой лендинг",
    description: "Проверь index.html в браузере — убедись что всё красиво.",
    color: "text-blue-400",
    action: (launch: Launch) => ({
      label: "Открыть",
      href: `file:///${launch.projectDir}/index.html`,
    }),
  },
  {
    icon: Globe,
    title: "Задеплой на Vercel",
    description: "Перетащи папку проекта на vercel.com — получишь публичный URL за 1 минуту.",
    color: "text-violet-400",
    action: () => ({ label: "Vercel →", href: "https://vercel.com/new" }),
  },
  {
    icon: FolderOpen,
    title: "Купи домен",
    description: "Namecheap или Porkbun — от $8/год. Подключи к Vercel в настройках.",
    color: "text-amber-400",
    action: () => ({ label: "Namecheap →", href: "https://namecheap.com" }),
  },
  {
    icon: CreditCard,
    title: "Подключи оплату",
    description: "Stripe Payment Links — создай ссылку за 5 минут без кода. Вставь в лендинг.",
    color: "text-green-400",
    action: () => ({ label: "Stripe →", href: "https://stripe.com/payment-links" }),
  },
  {
    icon: Megaphone,
    title: "Запусти на ProductHunt",
    description: "Выложи продукт, добавь скриншоты лендинга. Лучшее время — вторник-среда, 00:01 PT.",
    color: "text-orange-400",
    action: () => ({ label: "ProductHunt →", href: "https://producthunt.com/posts/new" }),
  },
];

export default function LaunchesPage() {
  const router = useRouter();
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/launches")
      .then((r) => r.json())
      .then((d) => {
        setLaunches((d.launches || []).reverse());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Запуски</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Сгенерированные продукты — от идеи до продажи
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {launches.length} продуктов
        </Badge>
      </div>

      {/* Empty state */}
      {launches.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Rocket className="size-10 opacity-30" />
            <p className="text-sm">Пока нет запущенных продуктов</p>
            <p className="text-xs opacity-70">
              Открой идею с вердиктом BUILD или BET и нажми «Запустить»
            </p>
          </CardContent>
        </Card>
      )}

      {/* Launches list */}
      <div className="space-y-4">
        {launches.map((launch) => (
          <Card key={launch.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{launch.productName}</CardTitle>
                    <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">
                      готов
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{launch.tagline}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Package className="size-3" />
                      {launch.ideaTitle}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(launch.generatedAt).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => router.push(`/launches/${launch.slug}`)}
                  >
                    <Code2 className="size-3" />
                    Редактировать
                  </Button>
                  <Button
                    size="sm"
                    variant={expanded === launch.id ? "secondary" : "default"}
                    className="gap-1.5 text-xs"
                    onClick={() =>
                      setExpanded(expanded === launch.id ? null : launch.id)
                    }
                  >
                    <Rocket className="size-3" />
                    {expanded === launch.id ? "Скрыть план" : "План продаж"}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Sell plan — expands on click */}
            {expanded === launch.id && (
              <CardContent className="pt-0 pb-4">
                <div className="border-t pt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                    5 шагов от лендинга до первой продажи
                  </p>
                  <div className="space-y-3">
                    {SELL_STEPS.map((step, i) => {
                      const action = step.action(launch);
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-md bg-muted/30 p-3"
                        >
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <step.icon className={`size-3.5 ${step.color}`} />
                              <span className="text-sm font-medium">{step.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="shrink-0 h-7 text-xs gap-1"
                            onClick={() => window.open(action.href)}
                          >
                            {action.label}
                            <ExternalLink className="size-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Domain suggestion */}
                  {launch.domain && (
                    <div className="mt-3 flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
                      <Globe className="size-4 text-amber-400 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Рекомендуемый домен</p>
                        <p className="text-sm font-mono font-medium">{launch.domain}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() =>
                          window.open(`https://www.namecheap.com/domains/registration/results/?domain=${launch.domain}`)
                        }
                      >
                        Проверить
                      </Button>
                    </div>
                  )}

                  {/* Project dir */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <FolderOpen className="size-3.5 shrink-0" />
                    <span className="font-mono truncate">{launch.projectDir}</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Bottom tip */}
      {launches.length > 0 && (
        <div className="flex items-start gap-2 rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
          <CheckCircle2 className="size-4 shrink-0 text-green-400 mt-0.5" />
          <span>
            Совет: самый быстрый путь к первой продаже — задеплоить на Vercel, добавить
            Stripe Payment Link прямо в лендинг и опубликовать в Reddit r/SaaS или Indie Hackers.
          </span>
        </div>
      )}
    </div>
  );
}
