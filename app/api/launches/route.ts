import { NextResponse } from 'next/server';
import fs from 'fs';

const LAUNCHES_FILE = 'C:/autonomy-data/launches.json';

export async function GET() {
  try {
    const raw = fs.readFileSync(LAUNCHES_FILE, 'utf8');
    const launches = JSON.parse(raw);
    return NextResponse.json({ launches, source: 'live' });
  } catch {
    return NextResponse.json({ launches: [], source: 'empty' });
  }
}
