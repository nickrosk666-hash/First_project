"use client";

import { useState } from "react";
import { Rocket, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LaunchState = "idle" | "confirming" | "launching" | "launched";

export function LaunchButton({
  ideaId,
  ideaTitle,
  disabled,
}: {
  ideaId: number;
  ideaTitle: string;
  disabled?: boolean;
}) {
  const [state, setState] = useState<LaunchState>("idle");
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const handleLaunch = async () => {
    setState("launching");
    setLogs([]);

    const steps = [
      "Инициализация агента builder...",
      "Создание репозитория на GitHub...",
      "Генерация структуры проекта...",
      "Настройка CI/CD pipeline...",
      "Создание лендинга...",
      "Настройка базы данных...",
      "Деплой MVP на Vercel...",
      "Агент запущен! Отслеживайте прогресс в разделе Агенты.",
    ];

    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
      setLogs((prev) => [...prev, step]);
    }

    setState("launched");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            {state === "launched" ? "Агент запущен!" : "Запуск проекта"}
          </DialogTitle>
          <DialogDescription>
            {state === "confirming" && (
              <>
                Вы собираетесь запустить агента-строителя для проекта{" "}
                <strong className="text-foreground">{ideaTitle}</strong>.
                Агент автоматически создаст репозиторий, сгенерирует MVP и задеплоит его.
              </>
            )}
            {state === "launching" && "Агент выполняет задачи..."}
            {state === "launched" && "Проект создан и передан агенту для дальнейшей разработки."}
          </DialogDescription>
        </DialogHeader>

        {(state === "launching" || state === "launched") && (
          <div className="rounded-md bg-muted/50 p-3 max-h-64 overflow-y-auto">
            <div className="space-y-1.5 font-mono text-xs">
              {logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  {i === logs.length - 1 && state === "launching" ? (
                    <Loader2 className="mt-0.5 size-3 shrink-0 animate-spin text-blue-400" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-verdict-build" />
                  )}
                  <span>{log}</span>
                </div>
              ))}
              {state === "launching" && logs.length < 8 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  <span>Обработка...</span>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {state === "confirming" && (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleLaunch} className="gap-2">
                <Rocket className="size-4" />
                Подтвердить запуск
              </Button>
            </>
          )}
          {state === "launched" && (
            <Button onClick={() => setOpen(false)}>
              Закрыть
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
