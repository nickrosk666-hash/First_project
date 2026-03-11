import { NextResponse } from "next/server";
import { getUserStats, getQuestsForToday, getRecentActivity, getBudgetUsed, getDailyRunsToday } from "@/lib/queries/stats";
import { getAchievements } from "@/lib/queries/stats";
import { getPendingCount, getTotalIdeasCount } from "@/lib/queries/ideas";

export async function GET() {
  const stats = getUserStats();
  const quests = getQuestsForToday();
  const achievements = getAchievements();
  const activity = getRecentActivity(10);
  const budgetUsed = getBudgetUsed();
  const dailyRuns = getDailyRunsToday();
  const pendingCount = getPendingCount();
  const totalIdeas = getTotalIdeasCount();

  return NextResponse.json({
    stats,
    quests,
    achievements,
    activity,
    budgetUsed,
    dailyRuns,
    pendingCount,
    totalIdeas,
  });
}
