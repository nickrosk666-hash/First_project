"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Compass, Loader2, CheckCircle2, AlertCircle, Search } from "lucide-react";

type JobStatus = "idle" | "pending" | "searching" | "analyzing" | "saving" | "complete" | "error";

interface JobResult {
  totalSearchResults: number;
  ideasFound: number;
  ideasSaved: number;
  ideas: { id: number; title: string; verdict: string; composite: number }[];
}

export function HuntDialog({ onComplete }: { onComplete?: () => void }) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState("");
  const [status, setStatus] = useState<JobStatus>("idle");
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<JobResult | null>(null);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function reset() {
    setStatus("idle");
    setProgress("");
    setResult(null);
    setError("");
  }

  async function startHunt() {
    reset();
    setStatus("pending");

    try {
      const res = await fetch("/api/hunt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: direction.trim() || undefined }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Ошибка запуска");
        setStatus("error");
        return;
      }

      const { jobId } = await res.json();

      // Poll for status
      pollRef.current = setInterval(async () => {
        try {
          const jr = await fetch(`/api/jobs/${jobId}`);
          const job = await jr.json();
          setStatus(job.status);
          setProgress(job.progress || "");

          if (job.status === "complete") {
            setResult(job.result);
            if (pollRef.current) clearInterval(pollRef.current);
          } else if (job.status === "error") {
            setError(job.error || "Неизвестная ошибка");
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch {
          // continue polling
        }
      }, 3000);
    } catch (e) {
      setError(String(e));
      setStatus("error");
    }
  }

  const isRunning = ["pending", "searching", "analyzing", "saving"].includes(status);

  const statusLabels: Record<string, string> = {
    pending: "Подготовка...",
    searching: "Поиск идей",
    analyzing: "Анализ Claude",
    saving: "Сохранение",
    complete: "Готово",
    error: "Ошибка",
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Compass className="size-3.5" />
            Найти идеи
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Поиск бизнес-идей</DialogTitle>
          <DialogDescription>
            Поиск по Reddit, Product Hunt, YouTube и другим источникам с анализом Claude
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {status === "idle" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Направление <span className="text-muted-foreground">(опционально)</span>
                </label>
                <Input
                  placeholder="AI, Telegram, путешествия, e-commerce..."
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startHunt()}
                />
                <p className="text-xs text-muted-foreground">
                  Оставьте пустым для поиска во всех нишах
                </p>
              </div>
              <Button onClick={startHunt} className="w-full gap-2">
                <Search className="size-4" />
                Запустить поиск
              </Button>
            </>
          )}

          {isRunning && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Loader2 className="size-5 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-medium">{statusLabels[status]}</p>
                  <p className="text-xs text-muted-foreground">{progress}</p>
                </div>
              </div>
              <div className="flex gap-1">
                {["searching", "analyzing", "saving"].map((step) => (
                  <div
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      status === step
                        ? "bg-primary animate-pulse"
                        : ["searching", "analyzing", "saving"].indexOf(status) >
                          ["searching", "analyzing", "saving"].indexOf(step)
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {status === "complete" && result && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="size-5" />
                <span className="text-sm font-medium">Поиск завершён</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-2xl font-bold">{result.totalSearchResults}</p>
                  <p className="text-xs text-muted-foreground">результатов</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-2xl font-bold">{result.ideasFound}</p>
                  <p className="text-xs text-muted-foreground">идей найдено</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-2xl font-bold">{result.ideasSaved}</p>
                  <p className="text-xs text-muted-foreground">сохранено</p>
                </div>
              </div>
              {result.ideas.length > 0 && (
                <div className="space-y-2">
                  {result.ideas.map((idea) => (
                    <div
                      key={idea.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <span className="text-sm font-medium">{idea.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm tabular-nums font-semibold">
                          {idea.composite.toFixed(1)}
                        </span>
                        <Badge
                          variant={idea.verdict === "BUILD" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {idea.verdict}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button
                onClick={() => { setOpen(false); reset(); onComplete?.(); }}
                className="w-full"
              >
                Обновить список идей
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="size-5" />
                <span className="text-sm font-medium">Ошибка</span>
              </div>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={reset} className="w-full">
                Попробовать снова
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}