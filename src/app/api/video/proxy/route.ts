import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  try {
    const fetchHeaders: Record<string, string> = {};
    const range = req.headers.get('Range');
    if (range) fetchHeaders['Range'] = range;

    const resp = await fetch(url, { headers: fetchHeaders });
    if (!resp.ok && resp.status !== 206) {
      return NextResponse.json({ error: 'Fetch failed' }, { status: resp.status });
    }

    const buffer = Buffer.from(await resp.arrayBuffer());

    const headers: Record<string, string> = {
      'Content-Type': resp.headers.get('Content-Type') || 'video/mp4',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=86400',
      'Accept-Ranges': 'bytes',
    };

    if (resp.status === 206) {
      const cr = resp.headers.get('Content-Range');
      if (cr) headers['Content-Range'] = cr;
    }

    const download = req.nextUrl.searchParams.get('download');
    if (download === '1') {
      headers['Content-Disposition'] = 'attachment; filename="video.mp4"';
    }

    return new NextResponse(buffer, { status: resp.status, headers });
  } catch (e) {
    console.error('Video proxy error:', e);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
  }
}
