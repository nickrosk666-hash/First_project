import { NextRequest, NextResponse } from "next/server";
import { updateIdeaStatus, getIdeaById } from "@/lib/queries/ideas";
import { addXP, logActivity, updateStreak } from "@/lib/queries/stats";
import { XP_REWARDS } from "@/lib/constants";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ideaId = Number(id);
  const body = await request.json();
  const { action } = body as { action: "approve" | "reject" | "launch" };

  const idea = getIdeaById(ideaId);
  if (!idea) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let xpEarned = 0;

  switch (action) {
    case "approve":
      updateIdeaStatus(ideaId, "validated");
      xpEarned = XP_REWARDS.approve;
      break;
    case "reject":
      updateIdeaStatus(ideaId, "rejected");
      xpEarned = XP_REWARDS.reject;
      break;
    case "launch":
      updateIdeaStatus(ideaId, "launched");
      xpEarned = XP_REWARDS.launch;
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const stats = addXP(xpEarned);
  logActivity(action, ideaId, xpEarned);
  const streak = updateStreak();

  return NextResponse.json({
    success: true,
    xpEarned,
    stats,
    streak,
    idea: getIdeaById(ideaId),
  });
}
