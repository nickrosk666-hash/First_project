"use client";

import { useState } from "react";
import { Rocket, Loader2, CheckCircle2, ExternalLink, AlertCircle } from "lucide-react";
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

    addLog("Отправка задачи агенту-строителю...");

    try {
      addLog("Подключение к n8n workflow...");

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

      addLog(`Продукт создан: "${data.productName}"`);
      addLog(`Слоган: ${data.tagline}`);
      addLog(`Лендинг сохранён в: ${data.projectDir}`);
      addLog(`Рекомендуемый домен: ${data.domain}`);
      addLog("✅ Готово! Открой index.html в браузере.");

      setResult(data);
      setState("launched");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
      addLog(`❌ Ошибка: ${msg}`);
      addLog("Убедись что n8n запущен и workflow 02 импортирован.");
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
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
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
            {state === "launched" ? "🚀 Продукт создан!" :
             state === "error" ? "Ошибка запуска" :
             "Запуск проекта"}
          </DialogTitle>
          <DialogDescription>
            {state === "confirming" && (
              <>
                Агент-строитель сгенерирует полный продукт на основе идеи{" "}
                <strong className="text-foreground">«{idea.title}»</strong>:
                лендинг, описание, план разработки и структуру кода.
              </>
            )}
            {state === "launching" && "Агент работает, подожди ~30 секунд..."}
            {state === "launched" && "Лендинг и бриф сохранены на диск. Готово к запуску!"}
            {state === "error" && "Что-то пошло не так. Проверь что n8n запущен."}
          </DialogDescription>
        </DialogHeader>

        {(state === "launching" || state === "launched" || state === "error") && (
          <div className="rounded-md bg-muted/50 p-3 max-h-64 overflow-y-auto">
            <div className="space-y-1.5 font-mono text-xs">
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  {i === logs.length - 1 && state === "launching" ? (
                    <Loader2 className="mt-0.5 size-3 shrink-0 animate-spin text-blue-400" />
                  ) : log.startsWith("❌") ? (
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
                  <span>Генерирую продукт через Claude...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {state === "launched" && result && (
          <div className="rounded-md border border-green-500/20 bg-green-500/5 p-3 text-sm space-y-1">
            <p className="font-medium text-green-400">{result.productName}</p>
            <p className="text-muted-foreground text-xs">{result.tagline}</p>
            <p className="text-xs text-muted-foreground mt-2">
              📁 {result.projectDir}
            </p>
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
                  className="gap-2"
                  onClick={() => window.open(`file:///${result.projectDir}/index.html`)}
                >
                  <ExternalLink className="size-4" />
                  Открыть лендинг
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
