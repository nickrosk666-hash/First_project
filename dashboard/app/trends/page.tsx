import TopBar from "@/components/layout/TopBar";
import { getDb } from "@/lib/db";
import { getBudgetUsed } from "@/lib/queries/stats";
import type { TrendSignal } from "@/types/idea";
import TrendsClient from "@/components/charts/TrendsClient";

function getTrendSignals(): TrendSignal[] {
  const db = getDb();
  try {
    return db.prepare("SELECT * FROM trend_signals ORDER BY value DESC").all() as TrendSignal[];
  } catch { return []; }
}

function getScoreDistribution() {
  const db = getDb();
  try {
    return db.prepare(`
      SELECT
        CASE
          WHEN score_composite >= 8 THEN 'BUILD'
          WHEN score_composite >= 6.5 THEN 'BET'
          WHEN score_composite >= 4.5 THEN 'FLIP'
          ELSE 'KILL'
        END as verdict,
        COUNT(*) as count
      FROM ideas
      WHERE score_composite IS NOT NULL
      GROUP BY 1
    `).all() as Array<{ verdict: string; count: number }>;
  } catch { return []; }
}

function getSourcePerformance() {
  const db = getDb();
  try {
    return db.prepare(`
      SELECT source, ROUND(AVG(score_composite), 1) as avg_score, COUNT(*) as count
      FROM ideas
      WHERE score_composite IS NOT NULL
      GROUP BY source
      ORDER BY avg_score DESC
    `).all() as Array<{ source: string; avg_score: number; count: number }>;
  } catch { return []; }
}

export default function TrendsPage() {
  const signals = getTrendSignals();
  const distribution = getScoreDistribution();
  const sourcePerf = getSourcePerformance();
  const budgetUsed = getBudgetUsed();

  return (
    <>
      <TopBar title="Trends" />
      <div className="p-6">
        <TrendsClient
          signals={signals}
          distribution={distribution}
          sourcePerformance={sourcePerf}
          budgetUsed={budgetUsed}
        />
      </div>
    </>
  );
}
