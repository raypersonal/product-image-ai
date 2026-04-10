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

  try {
    const upstream = await fetch(targetUrl.toString(), { headers });

    if (!upstream.ok && upstream.status !== 206) {
      return new Response(JSON.stringify({ error: 'upstream error', status: upstream.status, contentType: upstream.headers.get('content-type') }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const resHeaders = new Headers({
      'Content-Type': upstream.headers.get('Content-Type') || 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    });
    const cr = upstream.headers.get('Content-Range');
    if (cr) resHeaders.set('Content-Range', cr);

    return new Response(upstream.body, { status: upstream.status, headers: resHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, name: err.name, target: targetUrl.toString() }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}
