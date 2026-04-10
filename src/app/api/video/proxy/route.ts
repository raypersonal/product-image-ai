export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response(JSON.stringify({ error: '缺少 url 参数' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const response = await fetch(url);

    if (!response.ok || !response.body) {
      return new Response(JSON.stringify({ error: `远程请求失败: HTTP ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'video/mp4',
        'Content-Disposition': 'inline; filename="video.mp4"',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Video proxy error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : '代理请求失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
