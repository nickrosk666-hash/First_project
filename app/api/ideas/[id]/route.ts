import { NextResponse } from 'next/server';
import { mockIdeas } from '@/lib/mock-data';
import fs from 'fs';

const IDEAS_FILE = process.env.IDEAS_FILE_PATH || 'C:/AI Cloude/Projects/autonomy/data/ideas.json';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numId = parseInt(id, 10);

  try {
    const raw = fs.readFileSync(IDEAS_FILE, 'utf8');
    const ideas = JSON.parse(raw);
    const idea = ideas.find((i: { id: number }) => i.id === numId);
    if (idea) return NextResponse.json(idea);
  } catch {
    // fall through to mock
  }

  const mockIdea = mockIdeas.find(i => i.id === numId);
  if (mockIdea) return NextResponse.json(mockIdea);

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
