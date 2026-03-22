"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Search, CheckCircle2, AlertCircle } from "lucide-react";

interface HuntJob {
  id: string;
  status: string;
  progress: string;
  ideas_created: number;
  result: {
    totalResults?: number;
    candidates?: number;
    saved?: number;
    skippedLow?: number;
    skippedDup?: number;
    ideas?: { title: string; verdict: string; composite: number }[];
  } | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export function HuntHistory() {
  const [jobs, setJobs] = useState<HuntJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hunt/history")
      .then((r) => r.json())
      .then((data) => setJobs(data.jobs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || jobs.length === 0) return null;

  const lastJob = jobs[0];
  const lastDate = lastJob ? new Date(lastJob.created_at) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="size-4" />
            История поисков
          </CardTitle>
          {lastDate && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              {lastDate.toLocaleDateString("ru-RU")} {lastDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {jobs.slice(0, 5).map((job) => {
          const date = new Date(job.created_at);
          const isOk = job.status === "complete";
          const isErr = job.status === "error";

          return (
            <div
              key={job.id}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                {isOk && <CheckCircle2 className="size-3.5 text-green-500" />}
                {isErr && <AlertCircle className="size-3.5 text-destructive" />}
                {!isOk && !isErr && (
                  <div className="size-3.5 rounded-full bg-muted animate-pulse" />
                )}
                <span className="text-xs">
                  {date.toLocaleDateString("ru-RU")}{" "}
                  {date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isOk && job.result && (
                  <>
                    <span className="text-xs text-muted-foreground">
                      {job.result.totalResults || 0} источников
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      +{job.ideas_created}
                    </Badge>
                  </>
                )}
                {isErr && (
                  <span className="text-xs text-destructive truncate max-w-[200px]">
                    {job.error}
                  </span>
                )}
                {!isOk && !isErr && (
                  <span className="text-xs text-muted-foreground">{job.progress}</span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
