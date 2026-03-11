import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function scoreToColor(score: number): string {
  if (score >= 7) return "text-verdict-build";
  if (score >= 4.5) return "text-verdict-bet";
  return "text-verdict-kill";
}

export function scoreToBarColor(score: number): string {
  if (score >= 7) return "bg-verdict-build";
  if (score >= 4.5) return "bg-verdict-bet";
  return "bg-verdict-kill";
}

export function verdictToColor(verdict: string): string {
  switch (verdict) {
    case "BUILD": return "text-verdict-build";
    case "BET": return "text-verdict-bet";
    case "FLIP": return "text-verdict-flip";
    case "KILL": return "text-verdict-kill";
    default: return "text-text-muted";
  }
}

export function verdictToBg(verdict: string): string {
  switch (verdict) {
    case "BUILD": return "bg-verdict-build/10";
    case "BET": return "bg-verdict-bet/10";
    case "FLIP": return "bg-verdict-flip/10";
    case "KILL": return "bg-verdict-kill/10";
    default: return "bg-bg-surface2";
  }
}

export function sourceColor(source: string): string {
  const colors: Record<string, string> = {
    google: "#4285F4",
    hackernews: "#FF6600",
    reddit: "#FF4500",
    youtube: "#FF0000",
    github: "#E6E6E6",
    devto: "#3B49DF",
    producthunt: "#DA552F",
    techcrunch: "#0A9B2C",
    news: "#A1A1AA",
  };
  return colors[source] ?? "#A1A1AA";
}

export function sourceName(source: string): string {
  const names: Record<string, string> = {
    google: "Google News",
    hackernews: "HackerNews",
    reddit: "Reddit",
    youtube: "YouTube",
    github: "GitHub",
    devto: "Dev.to",
    producthunt: "ProductHunt",
    techcrunch: "TechCrunch",
    news: "News",
  };
  return names[source] ?? source;
}

export function engagementLabel(source: string, score: number): string {
  if (!score) return "";
  switch (source) {
    case "hackernews": return `${score} pts`;
    case "reddit": return `${score} upvotes`;
    case "youtube": return `${score} views`;
    case "github": return `${score}★`;
    case "producthunt": return `${score} votes`;
    case "devto": return `${score} reactions`;
    default: return "";
  }
}

export function relativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}
