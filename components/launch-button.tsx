"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Rocket,
  Loader2,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Globe,
  CreditCard,
  Megaphone,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Idea } from "@/lib/types";

type LaunchState = "idle" | "confirming" | "launching" | "launched" | "error";

interface LaunchResult {
  success: boolean;
  productName?: string;
  tagline?: string;
  slug?: string;
  projectDir?: string;
  landingPageUrl?: string;
  domain?: string;
  error?: string;
}

const SELL_STEPS = [
  {
    icon: ExternalLink,
    title: "Проверь лендинг",
    desc: "Открой index.html локально",
    color: "text-blue-400",
  },
  {
    icon: Globe,
    title: "Задеплой на Vercel",
    desc: "vercel.com → перетащи папку",
    color: "text-violet-400",
  },
  {
    icon: FolderOpen,
    title: "Купи домен",
    desc: "Namecheap от $8/год",
    color: "text-amber-400",
  },
  {
    icon: CreditCard,
    title: "Stripe Payment Link",
    desc: "Кнопка оплаты без кода",
    color: "text-green-400",
  },
  {
    icon: Megaphone,
    title: "ProductHunt / Reddit",
    desc: "Первые пользователи",
    color: "text-orange-400",
  },
];

export function LaunchButton({
  idea,
  disabled,
}: {
  idea: Pick<Idea, "id" | "title" | "description" | "verdict" | "scores" | "sourceUrl">;
  disabled?: boolean;
}) {
  const [state, setState] = useState<LaunchState>("idle");
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<LaunchResult | null>(null);

  const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  const handleLaunch = async () => {
    setState("launching");
    setLogs([]);
    setResult(null);

    addLog("Подключение к n8n workflow...");

    try {
      const response = await fetch("http://localhost:5678/webhook/launch-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ideaId: idea.id,
          title: idea.title,
          description: idea.description,
          verdict: idea.verdict,
          scores: idea.scores,
          sourceUrl: idea.sourceUrl,
        }),
      });

      if (!response.ok) throw new Error(`n8n ответил ${response.status}`);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      addLog(`✅ Продукт: "${data.productName}"`);
      addLog(`✅ Слоган: ${data.tagline}`);
      addLog(`✅ Лендинг: ${data.projectDir}`);
      if (data.domain) addLog(`✅ Домен: ${data.domain}`);

      setResult(data);
      setState("launched");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
      addLog(`❌ Ошибка: ${msg}`);
      addLog("Убедись что n8n запущен и workflow 02 активен.");
      setState("error");
    }
  };

  const handleClose = () => {
    setOpen(false);
    if (state === "launched" || state === "error") {
      setState("idle");
      setLogs([]);
      setResult(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
        else setOpen(true);
      }}
    >
      <Button
        size="lg"
        className="gap-2"
        disabled={disabled}
        onClick={() => {
          setState("confirming");
          setOpen(true);
        }}
      >
        <Rocket className="size-4" />
        Запустить
      </Button>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {state === "launched"
              ? "🚀 Продукт создан!"
              : state === "error"
              ? "Ошибка запуска"
              : "Запуск проекта"}
          </DialogTitle>
          <DialogDescription>
            {state === "confirming" && (
              <>
                Агент сгенерирует лендинг, бриф и план запуска для идеи{" "}
                <strong className="text-foreground">«{idea.title}»</strong>.
              </>
            )}
            {state === "launching" && "Агент работает, подожди ~30 секунд..."}
            {state === "launched" && "Лендинг и бриф сохранены. Вот что делать дальше:"}
            {state === "error" && "Что-то пошло не так. Проверь что n8n запущен."}
          </DialogDescription>
        </DialogHeader>

        {/* Logs */}
        {(state === "launching" || state === "launched" || state === "error") && (
          <div className="rounded-md bg-muted/50 p-3 max-h-36 overflow-y-auto">
            <div className="space-y-1 font-mono text-xs">
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  {log.startsWith("❌") ? (
                    <AlertCircle className="mt-0.5 size-3 shrink-0 text-red-400" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-green-400" />
                  )}
                  <span className={log.startsWith("❌") ? "text-red-400" : ""}>{log}</span>
                </div>
              ))}
              {state === "launching" && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  <span>Генерирую через Claude...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product card */}
        {state === "launched" && result && (
          <div className="rounded-md border border-green-500/20 bg-green-500/5 p-3 text-sm space-y-0.5">
            <p className="font-semibold text-green-400">{result.productName}</p>
            <p className="text-xs text-muted-foreground">{result.tagline}</p>
          </div>
        )}

        {/* Sell steps */}
        {state === "launched" && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              5 шагов до первой продажи
            </p>
            {SELL_STEPS.map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-md bg-muted/30 px-3 py-2"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                  {i + 1}
                </span>
                <step.icon className={`size-3.5 shrink-0 ${step.color}`} />
                <div className="min-w-0">
                  <span className="text-sm font-medium">{step.title}</span>
                  <span className="text-xs text-muted-foreground"> — {step.desc}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          {state === "confirming" && (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Отмена
              </Button>
              <Button onClick={handleLaunch} className="gap-2">
                <Rocket className="size-4" />
                Запустить агента
              </Button>
            </>
          )}

          {(state === "launched" || state === "error") && (
            <div className="flex gap-2 w-full justify-end">
              {state === "launched" && result?.projectDir && (
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() =>
                    window.open(`file:///${result.projectDir}/index.html`)
                  }
                >
                  <ExternalLink className="size-4" />
                  Лендинг
                </Button>
              )}
              {state === "launched" && (
                <Button variant="outline" className="gap-1.5" asChild>
                  <Link href="/launches" onClick={handleClose}>
                    <Rocket className="size-4" />
                    Все запуски
                  </Link>
                </Button>
              )}
              <Button onClick={handleClose}>Закрыть</Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
