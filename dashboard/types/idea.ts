export type Verdict = "BUILD" | "BET" | "FLIP" | "KILL";

export type IdeaStatus = "raw" | "pending_scoring" | "scored" | "validated" | "rejected" | "building" | "launched";

export type IdeaSource = "google" | "hackernews" | "reddit" | "youtube" | "github" | "devto" | "producthunt" | "techcrunch" | "news";

export interface Idea {
  id: number;
  title: string;
  description: string | null;
  source: IdeaSource;
  source_url: string | null;
  source_score: number;
  discovered_at: string;
  keywords_matched: string | null; // JSON array
  category: string | null;

  score_market: number | null;
  score_automation: number | null;
  score_pain_level: number | null;
  score_competition: number | null;
  score_willingness_to_pay: number | null;
  score_margin: number | null;
  score_build: number | null;
  score_timing: number | null;
  score_composite: number | null;

  verdict: Verdict | null;
  verdict_reason: string | null;
  status: IdeaStatus;
  business_plan: string | null; // JSON blob
  notes: string | null;
  scored_at: string | null;
}

export interface IdeaFilters {
  verdict?: Verdict | null;
  source?: IdeaSource | null;
  minScore?: number;
  maxScore?: number;
  status?: IdeaStatus;
  keyword?: string;
  limit?: number;
  offset?: number;
}

export interface BusinessPlan {
  market_analysis?: {
    tam: string;
    sam: string;
    som: string;
    target_audience: string;
  };
  competitors?: Array<{
    name: string;
    pricing: string;
    users: string;
    weakness: string;
  }>;
  revenue_model?: {
    pricing_tiers: string[];
    projected_arr: string;
  };
  technical?: {
    stack: string[];
    build_time: string;
    complexity: string;
  };
  risks?: Array<{
    risk: string;
    severity: "high" | "medium" | "low";
    mitigation: string;
  }>;
  launch_plan?: Array<{
    step: string;
    done: boolean;
  }>;
}

export interface DailyRun {
  id: number;
  run_date: string;
  source: string;
  items_found: number;
  items_passed_filter: number;
  items_scored: number;
  errors: string | null;
  duration_seconds: number | null;
}

export interface TrendSignal {
  id: number;
  keyword: string;
  source: string;
  signal_type: "rising" | "breakout" | "sustained";
  value: number;
  detected_at: string;
  related_ideas: string | null;
}
