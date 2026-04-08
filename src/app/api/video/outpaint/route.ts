import { NextRequest, NextResponse } from 'next/server';
import { jimengOutpaint } from '@/lib/jimengOutpaint';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      imageBase64,
      targetAspectRatio,
      prompt,
    } = body as {
      imageBase64: string;
      targetAspectRatio: '16:9' | '9:16' | '1:1';
      prompt?: string;
    };

    if (!imageBase64) {
      return NextResponse.json(
        { error: '请提供图片' },
        { status: 400 }
      );
    }

    if (!targetAspectRatio) {
      return NextResponse.json(
        { error: '请指定目标宽高比' },
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
    console.log('║           VIDEO OUTPAINT API - REQUEST                      ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Target Aspect Ratio: ${targetAspectRatio}`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    const result = await jimengOutpaint(accessKey, secretKey, {
      imageBase64,
      targetAspectRatio,
      prompt,
    });

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      requestId: result.requestId,
    });
  } catch (error) {
    console.error('\n❌ Video Outpaint API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '扩图失败' },
      { status: 500 }
    );
  }
}
