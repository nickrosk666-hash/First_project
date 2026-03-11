import Sidebar from "./Sidebar";
import { getUserStats, getBudgetUsed } from "@/lib/queries/stats";
import { getPendingCount } from "@/lib/queries/ideas";

export default function SidebarServer() {
  const stats = getUserStats();
  const budgetUsed = getBudgetUsed();
  const pendingCount = getPendingCount();

  return (
    <Sidebar
      xp={stats.xp}
      streak={stats.streak_current}
      pendingCount={pendingCount}
      budgetUsed={budgetUsed}
    />
  );
}
