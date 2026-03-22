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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type JobStatus = "idle" | "pending" | "searching" | "analyzing" | "saving" | "complete" | "error";

interface CheckResult {
  verdict: string;
  verdict_summary: string;
  key_findings: string[];
  competitors: { name: string; pricing: string; weakness: string }[];
  monetization?: { mrr_estimate: string };
}

interface CheckDialogProps {
  onComplete?: () => void;
  prefillTitle?: string;
  prefillDescription?: string;
  ideaId?: number;
  triggerVariant?: "outline" | "ghost";
  triggerLabel?: string;
}

export function CheckDialog({
  onComplete,
  prefillTitle = "",
  prefillDescription = "",
  ideaId,
  triggerVariant = "outline",
  triggerLabel = "Проверить идею",
}: CheckDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(prefillTitle);
  const [description, setDescription] = useState(prefillDescription);
  const [status, setStatus] = useState<JobStatus>("idle");
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (prefillTitle) setTitle(prefillTitle);
    if (prefillDescription) setDescription(prefillDescription);
  }, [prefillTitle, prefillDescription]);

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

  async function startCheck() {
    reset();
    setStatus("pending");

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          ideaId: ideaId || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Ошибка запуска");
        setStatus("error");
        return;
      }

      const { jobId } = await res.json();

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

  const verdictColors: Record<string, string> = {
    GO: "text-green-500",
    CONDITIONAL: "text-yellow-500",
    NO_GO: "text-red-500",
  };

  const verdictLabels: Record<string, string> = {
    GO: "GO — рынок открыт",
    CONDITIONAL: "CONDITIONAL — с оговорками",
    NO_GO: "NO-GO — не стоит",
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger
        render={
          <Button variant={triggerVariant} size="sm" className="gap-1.5 text-xs">
            <ShieldCheck className="size-3.5" />
            {triggerLabel}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Валидация бизнес-идеи</DialogTitle>
          <DialogDescription>
            Глубокий анализ: конкуренты, спрос, монетизация через Firecrawl + Claude
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {status === "idle" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Название идеи</label>
                <Input
                  placeholder="Telegram-бот для..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Описание</label>
                <Textarea
                  placeholder="Опиши идею подробнее..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={startCheck}
                disabled={!title.trim()}
                className="w-full gap-2"
              >
                <ShieldCheck className="size-4" />
                Запустить проверку
              </Button>
            </>
          )}

          {isRunning && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <Loader2 className="size-5 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-medium">
                    {status === "searching" ? "Исследование рынка" : status === "analyzing" ? "Анализ Claude" : status === "saving" ? "Сохранение" : "Подготовка"}
                  </p>
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
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-green-500" />
                <span className="text-sm font-medium">Анализ завершён</span>
              </div>

              {/* Verdict */}
              <div className="rounded-lg border p-4 text-center">
                <p className={`text-2xl font-bold ${verdictColors[result.verdict] || ""}`}>
                  {verdictLabels[result.verdict] || result.verdict}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{result.verdict_summary}</p>
              </div>

              {/* Key findings */}
              {result.key_findings?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Ключевые выводы</p>
                  {result.key_findings.map((f, i) => (
                    <p key={i} className="text-sm">• {f}</p>
                  ))}
                </div>
              )}

              {/* Competitors */}
              {result.competitors?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Конкуренты</p>
                  {result.competitors.slice(0, 4).map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{c.name}</span>
                      <Badge variant="secondary" className="text-xs">{c.pricing}</Badge>
                    </div>
                  ))}
                </div>
              )}

              {result.monetization?.mrr_estimate && (
                <p className="text-sm text-muted-foreground">
                  Потенциал MRR: <strong className="text-foreground">{result.monetization.mrr_estimate}</strong>
                </p>
              )}

              <Button
                onClick={() => { setOpen(false); reset(); onComplete?.(); }}
                className="w-full"
              >
                {ideaId ? "Обновить данные идеи" : "Закрыть"}
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