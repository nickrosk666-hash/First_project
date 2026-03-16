import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LAUNCHES_FILE = 'C:/autonomy-data/launches.json';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const launches = JSON.parse(fs.readFileSync(LAUNCHES_FILE, 'utf8'));
    const launch = launches.find((l: { slug: string }) => l.slug === slug);
    if (!launch) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Read brief.json for full metadata
    const briefPath = path.join(launch.projectDir, 'brief.json');
    let brief = null;
    try { brief = JSON.parse(fs.readFileSync(briefPath, 'utf8')); } catch { /* no brief */ }

    // Build file tree
    const savedFiles: string[] = launch.savedFiles || brief?.savedFiles || [];
    const files = savedFiles.map((f: string) => {
      const fullPath = path.join(launch.projectDir, f);
      let size = 0;
      try { size = fs.statSync(fullPath).size; } catch { /* missing */ }
      return { path: f, size };
    });

    return NextResponse.json({ launch, brief, files });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
