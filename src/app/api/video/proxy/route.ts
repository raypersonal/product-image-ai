export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) return new Response('Missing url', { status: 400 });

  const fetchHeaders = new Headers();
  const range = req.headers.get('Range');
  if (range) fetchHeaders.set('Range', range);

  const resp = await fetch(url, { headers: fetchHeaders });
  if (!resp.ok && resp.status !== 206) return new Response('Fetch failed', { status: resp.status });

  const respHeaders = new Headers();
  respHeaders.set('Content-Type', resp.headers.get('Content-Type') || 'video/mp4');
  respHeaders.set('Cache-Control', 'public, max-age=86400');
  respHeaders.set('Accept-Ranges', 'bytes');

  if (resp.headers.has('Content-Length')) respHeaders.set('Content-Length', resp.headers.get('Content-Length')!);
  if (resp.headers.has('Content-Range')) respHeaders.set('Content-Range', resp.headers.get('Content-Range')!);

  if (searchParams.get('download') === '1') {
    respHeaders.set('Content-Disposition', 'attachment; filename="video.mp4"');
  }

  return new Response(resp.body, { status: resp.status, headers: respHeaders });
}
