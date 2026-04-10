export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) return new Response('Missing url', { status: 400 });

  const resp = await fetch(url);
  if (!resp.ok) return new Response('Fetch failed', { status: resp.status });

  return new Response(resp.body, {
    headers: {
      'Content-Type': resp.headers.get('Content-Type') || 'video/mp4',
      'Content-Disposition': 'attachment; filename="video.mp4"',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
