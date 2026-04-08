import { NextRequest, NextResponse } from 'next/server';
import { generateVideo } from '@/lib/video/jimengVideo';

export const maxDuration = 180; // 视频生成需要更长时间

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      imageBase64,
      prompt,
      duration,
    } = body as {
      imageBase64: string;
      prompt: string;
      duration?: number;
    };

    if (!imageBase64) {
      return NextResponse.json(
        { error: '请提供图片' },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: '请提供视频提示词' },
        { status: 400 }
      );
    }

    const accessKey = process.env.VOLC_ACCESS_KEY;
    const secretKey = process.env.VOLC_SECRET_KEY;

    if (!accessKey || !secretKey) {
      return NextResponse.json(
        { error: '请配置 VOLC_ACCESS_KEY 和 VOLC_SECRET_KEY' },
        { status: 400 }
      );
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           VIDEO GENERATE API - REQUEST                      ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Duration: ${duration || 5}s`);
    console.log(`║ Prompt Length: ${prompt.length} chars`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // 生成视频
    const videoUrl = await generateVideo(
      accessKey,
      secretKey,
      {
        imageBase64,
        prompt,
        duration: duration || 5,
      },
      (status) => {
        console.log(`>>> Video status: ${status.status}, progress: ${status.progress || 0}%`);
      }
    );

    return NextResponse.json({
      success: true,
      videoUrl,
    });
  } catch (error) {
    console.error('\n❌ Video Generate API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '视频生成失败' },
      { status: 500 }
    );
  }
}
