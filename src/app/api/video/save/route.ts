import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      videoUrl,
      productName,
      basePath,
    } = body as {
      videoUrl: string;
      productName: string;
      basePath: string;
    };

    if (!videoUrl) {
      return NextResponse.json(
        { error: '没有视频URL' },
        { status: 400 }
      );
    }

    if (!basePath) {
      return NextResponse.json(
        { error: '请指定保存路径' },
        { status: 400 }
      );
    }

    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const safeName = (productName || 'video').replace(/[<>:"/\\|?*]/g, '_');
    const folderName = `${safeName}_${timestamp}`;
    const outputDir = path.join(basePath, folderName);
    const fileName = `video_${Date.now()}.mp4`;
    const filePath = path.join(outputDir, fileName);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           VIDEO SAVE API                                    ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Output: ${filePath}`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // 创建目录
    await fs.mkdir(outputDir, { recursive: true });

    // 下载视频
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`下载视频失败: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 保存文件
    await fs.writeFile(filePath, buffer);

    console.log('✅ Video saved successfully!');

    return NextResponse.json({
      success: true,
      filePath,
      folderName,
    });
  } catch (error) {
    console.error('\n❌ Video Save API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '保存失败' },
      { status: 500 }
    );
  }
}
