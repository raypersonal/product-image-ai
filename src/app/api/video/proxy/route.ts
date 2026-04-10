import { NextRequest, NextResponse } from 'next/server';
import { proxyFetch } from '@/lib/proxyFetch';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: '缺少 url 参数' }, { status: 400 });
  }

  try {
    const response = await proxyFetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: `远程请求失败: HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'video/mp4';

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline; filename="video.mp4"',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Video proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '代理请求失败' },
      { status: 500 }
    );
  }
}
