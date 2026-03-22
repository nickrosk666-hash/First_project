"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function IdeaChat({ ideaId }: { ideaId: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    fetch(`/api/ideas/${ideaId}/chat`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages?.length) setMessages(data.messages);
      })
      .catch(() => {})
      .finally(() => setHistoryLoaded(true));
  }, [ideaId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const optimistic: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/ideas/${ideaId}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const reply: Message = {
        role: "assistant",
        content: data.reply ?? data.error ?? "Ошибка",
      };
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Ошибка соединения. Попробуй ещё раз." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function clearHistory() {
    await fetch(`/api/ideas/${ideaId}/chat`, { method: "DELETE" });
    setMessages([]);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bot className="size-4 text-primary" />
            Спроси агента об этой идее
          </CardTitle>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive"
              onClick={clearHistory}
              title="Очистить историю"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
        {messages.length > 0 && (
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  {m.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                </div>
                <div className={`rounded-xl px-3.5 py-2.5 text-sm leading-relaxed max-w-[85%] whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Bot className="size-3.5" />
                </div>
                <div className="rounded-xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                  <span className="animate-pulse">Думаю...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Suggestions (shown when empty) */}
        {historyLoaded && messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {[
              "Какие главные риски у этой идеи?",
              "Как найти первых клиентов в США?",
              "Реален ли бюджет и сроки?",
              "Что может убить этот бизнес?",
            ].map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Задай вопрос агенту... (Enter — отправить, Shift+Enter — новая строка)"
            className="min-h-[64px] max-h-36 resize-none text-sm"
            disabled={loading}
          />
          <Button
            onClick={send}
            disabled={!input.trim() || loading}
            size="icon"
            className="shrink-0 h-10 w-10"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
