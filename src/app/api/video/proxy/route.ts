export const runtime = 'edge';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = url.searchParams.get('url');
  if (!target) return new Response('Missing url', { status: 400 });

  let targetUrl: URL;
  try { targetUrl = new URL(target); } catch { return new Response('Invalid url', { status: 400 }); }
  if (targetUrl.hostname !== 'tosv.byted.org') return new Response('Host not allowed', { status: 403 });

  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };
  const range = req.headers.get('Range');
  if (range) headers['Range'] = range;

  const upstream = await fetch(targetUrl.toString(), { headers });

  const resHeaders = new Headers({
    'Content-Type': upstream.headers.get('Content-Type') || 'video/mp4',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=86400',
    'Access-Control-Allow-Origin': '*',
  });
  const cr = upstream.headers.get('Content-Range');
  if (cr) resHeaders.set('Content-Range', cr);

  return new Response(upstream.body, { status: upstream.status, headers: resHeaders });
}
