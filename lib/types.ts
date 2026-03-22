export type AgentType = "discovery" | "validator" | "builder" | "launcher" | "operator";
export type AgentStatus = "running" | "paused" | "stopped" | "error" | "idle";
export type Verdict = "BUILD" | "BET" | "FLIP" | "KILL";
export type IdeaStatus = "raw" | "pending_scoring" | "scored" | "validated" | "rejected" | "building" | "launched";

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  businessId?: number;
  githubRepo?: string;
  lastHeartbeat: string;
  metrics: {
    tasksCompleted: number;
    errorRate: number;
    uptimePercent: number;
    costUsd: number;
  };
  createdAt: string;
}

export interface Idea {
  id: number;
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
  scoreComposite: number;
  verdict: Verdict;
  verdictReason: string;
  status: IdeaStatus;
  discoveredAt: string;
  isFavorite?: boolean;
  deletedAt?: string | null;
  scoreReasoning?: Record<string, { value: number; reason: string }> & { risks?: string[]; researchSummary?: string } | null;
  scores: {
    market: number;
    automation: number;
    pain: number;
    competition: number;
    willingnessToPay: number;
    margin: number;
    build: number;
    timing: number;
  };
  // Расширенное описание (генерируется Claude при валидации)
  detail?: {
    problem: string;
    valueProposition: string;
    targetAudience: string;
    features: string[];
    techStack: string[];
    pricing: string;
    launchSteps: { step: number; title: string; description: string }[];
    estimatedTimeline: string;
    estimatedCost: string;
  };
}

export interface DailyStats {
  date: string;
  totalFound: number;
  totalFiltered: number;
  totalScored: number;
}

export interface CostEntry {
  month: string;
  costUsd: number;
  tokensInput: number;
  tokensOutput: number;
}
