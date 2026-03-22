"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Idea } from "@/lib/types";

interface Props {
  idea: Idea;
  onUpdate?: (updated: Idea) => void;
  showRestore?: boolean;
  size?: "sm" | "default";
}

export function IdeaActions({ idea, onUpdate, showRestore = false, size = "default" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const updated = await res.json();
      onUpdate?.(updated);
      return updated as Idea;
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite() {
    await patch({ isFavorite: !idea.isFavorite });
  }

  async function deleteIdea() {
    const updated = await patch({ deleted: true });
    if (!onUpdate) {
      // navigated from detail page — go back to list
      if (!updated.deletedAt) return;
      router.push("/ideas");
    }
  }

  async function restoreIdea() {
    await patch({ deleted: false });
  }

  const iconSize = size === "sm" ? "size-3.5" : "size-4";
  const btnSize = size === "sm" ? "icon" as const : "icon" as const;

  return (
    <div className="flex items-center gap-1">
      {!idea.deletedAt && (
        <Button
          variant="ghost"
          size={btnSize}
          disabled={loading}
          onClick={toggleFavorite}
          title={idea.isFavorite ? "Убрать из избранного" : "В избранное"}
          className={idea.isFavorite ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-amber-500"}
        >
          <Star className={`${iconSize} ${idea.isFavorite ? "fill-current" : ""}`} />
        </Button>
      )}

      {showRestore && idea.deletedAt ? (
        <Button
          variant="ghost"
          size={btnSize}
          disabled={loading}
          onClick={restoreIdea}
          title="Восстановить"
          className="text-muted-foreground hover:text-green-500"
        >
          <RotateCcw className={iconSize} />
        </Button>
      ) : !idea.deletedAt ? (
        <Button
          variant="ghost"
          size={btnSize}
          disabled={loading}
          onClick={deleteIdea}
          title="Удалить"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className={iconSize} />
        </Button>
      ) : null}
    </div>
  );
}
