import type { AgentStatus, AgentType, Verdict } from "./types";

export const STATUS_LABELS: Record<AgentStatus, string> = {
  running: "Работает",
  paused: "Пауза",
  stopped: "Остановлен",
  error: "Ошибка",
  idle: "Ожидание",
};

export const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  discovery: "Поиск",
  validator: "Валидация",
  builder: "Сборка",
  launcher: "Запуск",
  operator: "Управление",
};

export const VERDICT_LABELS: Record<Verdict, string> = {
  BUILD: "Строить",
  BET: "Ставка",
  FLIP: "Пересмотр",
  KILL: "Отклонить",
};

export const SOURCE_LABELS: Record<string, string> = {
  hackernews: "Hacker News",
  reddit: "Reddit",
  google: "Google News",
  github: "GitHub",
  producthunt: "Product Hunt",
  devto: "Dev.to",
  youtube: "YouTube",
  news: "Новости",
};

export const SCORE_LABELS: Record<string, string> = {
  market: "Размер рынка",
  automation: "Автономность",
  pain: "Острота боли",
  competition: "Конкуренция (низкая = хорошо)",
  willingnessToPay: "Готовность платить",
  margin: "Маржинальность",
  build: "Сложность MVP (низкая = легко)",
  timing: "Тайминг входа",
};
