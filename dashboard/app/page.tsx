import TopBar from "@/components/layout/TopBar";
import StatCard from "@/components/dashboard/StatCard";
import QuestPanel from "@/components/dashboard/QuestPanel";
import EmpirePanel from "@/components/dashboard/EmpirePanel";
import HotDiscoveries from "@/components/dashboard/HotDiscoveries";
import PipelineHealth from "@/components/dashboard/PipelineHealth";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import { getUserStats, getQuestsForToday, getRecentActivity, getBudgetUsed, getDailyRunsToday, getAchievements } from "@/lib/queries/stats";
import { getTotalIdeasCount, getPendingCount, getTopIdeas } from "@/lib/queries/ideas";
import { DollarSign, Zap, Eye, Castle } from "lucide-react";
import type { DailyRun } from "@/types/idea";

export default function CommandCenter() {
  const stats = getUserStats();
  const quests = getQuestsForToday();
  const achievements = getAchievements();
  const activity = getRecentActivity(8);
  const budgetUsed = getBudgetUsed();
  const dailyRuns = getDailyRunsToday() as DailyRun[];
  const totalIdeas = getTotalIdeasCount();
  const pendingCount = getPendingCount();
  const topIdeas = getTopIdeas(3);

  return (
    <>
      <TopBar title="Command Center" />
      <div className="p-6 space-y-6">
        {/* Stat Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Ideas"
            value={totalIdeas}
            delta={dailyRuns.reduce((s, r) => s + r.items_scored, 0)}
            icon={<Zap className="w-4 h-4" />}
          />
          <StatCard
            label="Pending"
            value={pendingCount}
            icon={<Eye className="w-4 h-4" />}
          />
          <StatCard
            label="Colonies"
            value={stats.total_launched}
            icon={<Castle className="w-4 h-4" />}
          />
          <StatCard
            label="Budget"
            value={budgetUsed}
            formatType="currency"
            suffix="of $3.00"
            icon={<DollarSign className="w-4 h-4" />}
            progress={{ current: budgetUsed, max: 3 }}
          />
        </div>

        {/* Quests + Empire */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-7">
            <QuestPanel quests={quests} />
          </div>
          <div className="lg:col-span-5">
            <EmpirePanel stats={stats} achievements={achievements} />
          </div>
        </div>

        {/* Hot Discoveries */}
        <HotDiscoveries ideas={topIdeas} />

        {/* Pipeline + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <PipelineHealth runs={dailyRuns} />
          <ActivityTimeline entries={activity} />
        </div>
      </div>
    </>
  );
}
