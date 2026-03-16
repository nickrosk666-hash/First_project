import { NextResponse } from 'next/server';
import { mockIdeas } from '@/lib/mock-data';
import fs from 'fs';

const IDEAS_FILE = process.env.IDEAS_FILE_PATH || 'C:/AI Cloude/Projects/autonomy/data/ideas.json';

function getIdeasFromFile() {
  try {
    const raw = fs.readFileSync(IDEAS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function GET() {
  const fileIdeas = getIdeasFromFile();

  if (fileIdeas && fileIdeas.length > 0) {
    return NextResponse.json({ ideas: fileIdeas, source: 'live' });
  }

  return NextResponse.json({ ideas: mockIdeas, source: 'mock' });
}
