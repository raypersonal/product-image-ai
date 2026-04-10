export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) return new Response('Missing url', { status: 400 });

  // 转发 Range header
  const headers: Record<string, string> = {};
  const range = req.headers.get('Range');
  if (range) headers['Range'] = range;

  const resp = await fetch(url, { headers });
  if (!resp.ok && resp.status !== 206) return new Response('Fetch failed', { status: resp.status });

  const respHeaders: Record<string, string> = {
    'Content-Type': resp.headers.get('Content-Type') || 'video/mp4',
    'Cache-Control': 'public, max-age=86400',
    'Accept-Ranges': 'bytes',
  };

  const cl = resp.headers.get('Content-Length');
  if (cl) respHeaders['Content-Length'] = cl;
  const cr = resp.headers.get('Content-Range');
  if (cr) respHeaders['Content-Range'] = cr;

  const download = searchParams.get('download');
  if (download === '1') {
    respHeaders['Content-Disposition'] = 'attachment; filename="video.mp4"';
  }

  return new Response(resp.body, {
    status: resp.status,
    headers: respHeaders,
  });
}
