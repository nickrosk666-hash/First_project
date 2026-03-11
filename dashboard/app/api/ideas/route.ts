import { NextRequest, NextResponse } from "next/server";
import { getIdeas, getVerdictCounts } from "@/lib/queries/ideas";
import type { IdeaFilters, Verdict, IdeaSource } from "@/types/idea";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const filters: IdeaFilters = {};
  if (params.get("verdict")) filters.verdict = params.get("verdict") as Verdict;
  if (params.get("source")) filters.source = params.get("source") as IdeaSource;
  if (params.get("minScore")) filters.minScore = Number(params.get("minScore"));
  if (params.get("maxScore")) filters.maxScore = Number(params.get("maxScore"));
  if (params.get("keyword")) filters.keyword = params.get("keyword")!;
  if (params.get("limit")) filters.limit = Number(params.get("limit"));
  if (params.get("offset")) filters.offset = Number(params.get("offset"));

  const ideas = getIdeas(filters);
  const counts = getVerdictCounts();

  return NextResponse.json({ ideas, counts });
}
