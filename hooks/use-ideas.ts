"use client";

import { useState, useEffect, useCallback } from "react";
import type { Idea } from "@/lib/types";

export function useIdeas(type?: "favorites" | "deleted") {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"live" | "mock">("mock");

  const url = type ? `/api/ideas?type=${type}` : "/api/ideas";

  const load = useCallback(() => {
    setLoading(true);
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setIdeas(data.ideas ?? []);
        setSource(data.source ?? "mock");
      })
      .catch(() => setIdeas([]))
      .finally(() => setLoading(false));
  }, [url]);

  useEffect(() => { load(); }, [load]);

  return { ideas, loading, source, reload: load };
}

export function useIdea(id: number) {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch(`/api/ideas/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setIdea(data))
      .catch(() => setIdea(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/ideas/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const updated = await res.json();
    setIdea(updated);
    return updated as Idea;
  }

  return { idea, loading, patch };
}
