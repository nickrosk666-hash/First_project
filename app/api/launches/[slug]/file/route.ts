import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LAUNCHES_FILE = 'C:/autonomy-data/launches.json';

function getLaunch(slug: string) {
  const launches = JSON.parse(fs.readFileSync(LAUNCHES_FILE, 'utf8'));
  return launches.find((l: { slug: string }) => l.slug === slug);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const filePath = req.nextUrl.searchParams.get('path');
  if (!filePath) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

  try {
    const launch = getLaunch(slug);
    if (!launch) return NextResponse.json({ error: 'Launch not found' }, { status: 404 });

    const fullPath = path.join(launch.projectDir, filePath);
    // Security: ensure path stays within projectDir
    if (!fullPath.startsWith(path.resolve(launch.projectDir))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    return NextResponse.json({ content, path: filePath });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const filePath = req.nextUrl.searchParams.get('path');
  if (!filePath) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

  try {
    const { content } = await req.json();
    const launch = getLaunch(slug);
    if (!launch) return NextResponse.json({ error: 'Launch not found' }, { status: 404 });

    const fullPath = path.join(launch.projectDir, filePath);
    if (!fullPath.startsWith(path.resolve(launch.projectDir))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
    return NextResponse.json({ ok: true, path: filePath });
  } catch {
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}
