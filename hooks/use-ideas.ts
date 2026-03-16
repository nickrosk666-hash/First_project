"use client";

import { useState, useEffect } from "react";
import type { Idea } from "@/lib/types";

export function useIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"live" | "mock">("mock");

  useEffect(() => {
    fetch("/api/ideas")
      .then((r) => r.json())
      .then((data) => {
        setIdeas(data.ideas ?? []);
        setSource(data.source ?? "mock");
      })
      .catch(() => setIdeas([]))
      .finally(() => setLoading(false));
  }, []);

  return { ideas, loading, source };
}

export function useIdea(id: number) {
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ideas/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setIdea(data))
      .catch(() => setIdea(null))
      .finally(() => setLoading(false));
  }, [id]);

  return { idea, loading };
}
