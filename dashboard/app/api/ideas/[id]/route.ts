import { NextRequest, NextResponse } from "next/server";
import { getIdeaById } from "@/lib/queries/ideas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idea = getIdeaById(Number(id));
  if (!idea) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(idea);
}
