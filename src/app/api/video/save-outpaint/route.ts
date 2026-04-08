import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { downloadFile } from '@/lib/proxyFetch';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      imageData,
      aspectRatio,
    } = body as {
      imageData: string;  // base64 或 URL
      aspectRatio: string;  // 16:9, 9:16, 1:1
    };

    if (!imageData) {
      return NextResponse.json(
        { error: '没有图片数据' },
        { status: 400 }
      );
    }

    // 固定保存到项目根目录的 output/ 文件夹
    const outputDir = path.join(process.cwd(), 'output');

    // 生成文件名: outpaint_16x9_1712345678901.png
    const timestamp = Date.now();
    const ratioStr = (aspectRatio || '16x9').replace(':', 'x');
    const fileName = `outpaint_${ratioStr}_${timestamp}.png`;
    const filePath = path.join(outputDir, fileName);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           SAVE OUTPAINT IMAGE                               ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Aspect Ratio: ${aspectRatio}`);
    console.log(`║ Output: ${filePath}`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // 创建目录
    await fs.mkdir(outputDir, { recursive: true });

    let imageBuffer: Buffer;

    // 判断是 URL 还是 base64
    if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
      // 下载远程图片（支持代理）
      imageBuffer = await downloadFile(imageData);
    } else {
      // 处��� base64 数据
      let base64Data = imageData;
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1];
      }
      imageBuffer = Buffer.from(base64Data, 'base64');
    }

    // 保存文件
    await fs.writeFile(filePath, imageBuffer);

    console.log(`✅ Outpaint image saved: ${fileName}`);

    return NextResponse.json({
      success: true,
      filePath,
      fileName,
    });
  } catch (error) {
    console.error('\n❌ Save Outpaint API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '保存扩图失败' },
      { status: 500 }
    );
  }
}
