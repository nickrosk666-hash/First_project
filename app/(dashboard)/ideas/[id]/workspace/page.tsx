"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Bot,
  Code2,
  Megaphone,
  Plus,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { VerdictBadge } from "@/components/verdict-badge";
import type { Verdict } from "@/lib/types";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
}

interface Message {
  id?: number;
  role: string;
  content: string;
  created_at?: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  agent_id: string | null;
  priority: number;
}

interface WorkspaceData {
  idea: {
    id: number;
    title: string;
    description: string;
    status: string;
    verdict: string;
    scoreComposite: number;
  };
  agents: Agent[];
  tasks: Task[];
  messages: Record<string, Message[]>;
}

const ROLE_ICONS: Record<string, typeof Bot> = {
  architect: Bot,
  developer: Code2,
  marketer: Megaphone,
};

const ROLE_COLORS: Record<string, string> = {
  architect: "text-blue-400",
  developer: "text-green-400",
  marketer: "text-orange-400",
};

export default function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const ideaId = Number(id);

  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadWorkspace = useCallback(async () => {
    try {
      const res = await fetch(`/api/ideas/${ideaId}/workspace`);
      const json = await res.json();
      setData(json);
      setMessages(json.messages || {});
      if (json.agents?.length > 0 && !activeAgent) {
        setActiveAgent(json.agents[0].id);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [ideaId, activeAgent]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeAgent]);

  async function initWorkspace() {
    setLoading(true);
    await fetch(`/api/ideas/${ideaId}/workspace`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "init" }),
    });
    await loadWorkspace();
  }

  async function sendMessage() {
    if (!input.trim() || !activeAgent || sending) return;
    const msg = input.trim();
    setInput("");
    setSending(true);

    // Optimistically add user message
    setMessages((prev) => ({
      ...prev,
      [activeAgent]: [
        ...(prev[activeAgent] || []),
        { role: "user", content: msg },
      ],
    }));

    try {
      const res = await fetch(`/api/ideas/${ideaId}/workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "message", agentId: activeAgent, message: msg }),
      });
      const json = await res.json();
      if (json.reply) {
        setMessages((prev) => ({
          ...prev,
          [activeAgent]: [
            ...(prev[activeAgent] || []),
            { role: "assistant", content: json.reply },
          ],
        }));
      }
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  }

  async function addTask() {
    if (!newTaskTitle.trim()) return;
    await fetch(`/api/ideas/${ideaId}/workspace`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_task",
        title: newTaskTitle.trim(),
        agentId: activeAgent,
      }),
    });
    setNewTaskTitle("");
    setShowTaskForm(false);
    loadWorkspace();
  }

  async function toggleTask(taskId: number, currentStatus: string) {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    await fetch(`/api/ideas/${ideaId}/workspace`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_task", taskId, status: newStatus }),
    });
    loadWorkspace();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <Loader2 className="size-5 animate-spin mr-2" />
        Загрузка воркспейса...
      </div>
    );
  }

  // Not initialized yet
  if (!data?.agents?.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/ideas/${ideaId}`}>
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Воркспейс: {data?.idea?.title || "..."}
          </h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="text-4xl">🚀</div>
            <h2 className="text-lg font-semibold">Запустить разработку?</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Будут созданы 3 AI-агента (Архитектор, Разработчик, Маркетолог),
              каждый со своей специализацией и контекстом этого проекта.
              Агенты изолированы друг от друга и от других проектов.
            </p>
            <Button onClick={initWorkspace} size="lg" className="gap-2">
              <Bot className="size-5" />
              Создать воркспейс
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeAgentData = data.agents.find((a) => a.id === activeAgent);
  const activeMessages = activeAgent ? messages[activeAgent] || [] : [];
  const RoleIcon = activeAgentData ? ROLE_ICONS[activeAgentData.role] || Bot : Bot;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/ideas/${ideaId}`}>
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {data.idea.title}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <VerdictBadge verdict={data.idea.verdict as Verdict} />
              <span className="text-xs text-muted-foreground">
                {data.idea.scoreComposite.toFixed(1)}/10
              </span>
              <Badge variant="secondary" className="text-xs">
                {data.idea.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* Left panel: agents + tasks */}
        <div className="space-y-4">
          {/* Agent selector */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Агенты</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-3 pt-0">
              {data.agents.map((agent) => {
                const Icon = ROLE_ICONS[agent.role] || Bot;
                const color = ROLE_COLORS[agent.role] || "text-muted-foreground";
                const isActive = agent.id === activeAgent;
                const msgCount = (messages[agent.id] || []).length;

                return (
                  <button
                    key={agent.id}
                    onClick={() => setActiveAgent(agent.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      isActive
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <Icon className={`size-4 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {agent.role}
                      </p>
                    </div>
                    {msgCount > 0 && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {msgCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Задачи</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => setShowTaskForm(!showTaskForm)}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 p-3 pt-0">
              {showTaskForm && (
                <div className="flex gap-1 mb-2">
                  <Input
                    placeholder="Новая задача..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                    className="h-7 text-xs"
                  />
                  <Button size="sm" className="h-7 px-2 text-xs" onClick={addTask}>
                    OK
                  </Button>
                </div>
              )}
              {(data.tasks || []).length === 0 && !showTaskForm && (
                <p className="text-xs text-muted-foreground py-2">
                  Нет задач. Нажми + чтобы добавить.
                </p>
              )}
              {(data.tasks || []).map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id, task.status)}
                  className="w-full flex items-start gap-2 rounded px-2 py-1.5 text-left hover:bg-muted/50 transition-colors"
                >
                  {task.status === "completed" ? (
                    <CheckCircle2 className="size-3.5 mt-0.5 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="size-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  )}
                  <span
                    className={`text-xs ${
                      task.status === "completed"
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                  >
                    {task.title}
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right panel: chat */}
        <Card className="flex flex-col min-h-[500px] max-h-[calc(100vh-200px)]">
          {/* Chat header */}
          {activeAgentData && (
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <RoleIcon
                className={`size-4 ${ROLE_COLORS[activeAgentData.role] || ""}`}
              />
              <span className="text-sm font-medium">{activeAgentData.name}</span>
              <span className="text-xs text-muted-foreground">
                — {activeAgentData.role}
              </span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeMessages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <RoleIcon className="size-8 mx-auto mb-2 opacity-30" />
                <p>
                  Начни диалог с {activeAgentData?.name || "агентом"}
                </p>
                <p className="text-xs mt-1">
                  Агент знает контекст проекта и работает только над ним
                </p>
              </div>
            )}
            {activeMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="size-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex gap-2">
              <Textarea
                placeholder={`Сообщение для ${activeAgentData?.name || "агента"}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                rows={1}
                className="min-h-[36px] resize-none"
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="shrink-0"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
