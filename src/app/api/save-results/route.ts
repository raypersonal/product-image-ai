import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ImageData {
  id: string;
  promptId: string;
  url: string | null;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
}

interface PromptData {
  id: string;
  type: string;
  typeName: string;
  index: number;
  prompt: string;
}

interface AnalysisData {
  style: string;
  colorPalette: string;
  targetAudience: string;
  sellingPoints: string[];
  scenes: string[];
}

interface SaveRequest {
  productName: string;
  model: string;
  aspectRatio: string;
  images: ImageData[];
  prompts: PromptData[];
  analysisResult: AnalysisData | null;
  startTime?: string;
}

// 图片类型中文名称映射（用于文件命名）
const TYPE_NAME_MAP: Record<string, string> = {
  main: '主图',
  sellingPoint: '卖点图',
  scene: '场景图',
  detail: '细节图',
  usage: '使用图',
  handheld: '手持图',
};

/**
 * 清理文件名中的非法字符
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 50);
}

/**
 * 格式化时间戳为文件夹名称格式
 */
function formatTimestamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/**
 * 将 base64 图片数据转换为 Buffer
 */
function base64ToBuffer(base64Url: string): Buffer | null {
  try {
    // 移除 data:image/xxx;base64, 前缀
    const matches = base64Url.match(/^data:image\/\w+;base64,(.+)$/);
    if (matches && matches[1]) {
      return Buffer.from(matches[1], 'base64');
    }
    // 如果没有前缀，尝试直接解码
    if (!base64Url.startsWith('http')) {
      return Buffer.from(base64Url, 'base64');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 下载远程图片
 */
async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveRequest = await request.json();
    const { productName, model, aspectRatio, images, prompts, analysisResult, startTime } = body;

    if (!productName) {
      return NextResponse.json({ error: '缺少产品名称' }, { status: 400 });
    }

    const now = new Date();
    const timestamp = formatTimestamp(now);
    const folderName = `${sanitizeFilename(productName)}_${timestamp}`;

    // 项目根目录下的 output 文件夹
    const outputDir = path.join(process.cwd(), 'output', folderName);
    const imagesDir = path.join(outputDir, 'images');

    // 创建目录
    fs.mkdirSync(imagesDir, { recursive: true });

    // 统计信息
    let successCount = 0;
    let failedCount = 0;
    const imageResults: Array<{
      id: number;
      type: string;
      filename: string;
      prompt: string;
      status: 'success' | 'failed';
      generatedAt: string;
      duration: number;
      error?: string;
    }> = [];

    // 处理每张图片
    let imageIndex = 1;
    for (const image of images) {
      const prompt = prompts.find(p => p.id === image.promptId);
      if (!prompt) continue;

      const typeName = TYPE_NAME_MAP[prompt.type] || prompt.typeName;
      const filename = `${String(imageIndex).padStart(2, '0')}_${typeName}_${prompt.index}.png`;
      const filePath = path.join(imagesDir, filename);

      let status: 'success' | 'failed' = 'failed';
      let error: string | undefined;

      if (image.status === 'completed' && image.url) {
        try {
          let imageBuffer: Buffer | null = null;

          // 判断是 base64 还是 URL
          if (image.url.startsWith('data:image/')) {
            imageBuffer = base64ToBuffer(image.url);
          } else if (image.url.startsWith('http')) {
            imageBuffer = await downloadImage(image.url);
          }

          if (imageBuffer) {
            fs.writeFileSync(filePath, imageBuffer);
            status = 'success';
            successCount++;
          } else {
            error = '无法解析图片数据';
            failedCount++;
          }
        } catch (err) {
          error = err instanceof Error ? err.message : '保存图片失败';
          failedCount++;
        }
      } else {
        error = image.error || '图片未生成';
        failedCount++;
      }

      imageResults.push({
        id: imageIndex,
        type: typeName,
        filename,
        prompt: prompt.prompt,
        status,
        generatedAt: now.toISOString(),
        duration: 0, // 单张耗时暂无数据
        ...(error && { error }),
      });

      imageIndex++;
    }

    // 保存 prompts.json
    const promptsData = prompts.map((p, idx) => ({
      id: idx + 1,
      type: p.type,
      typeName: TYPE_NAME_MAP[p.type] || p.typeName,
      index: p.index,
      prompt: p.prompt,
    }));
    fs.writeFileSync(
      path.join(outputDir, 'prompts.json'),
      JSON.stringify(promptsData, null, 2),
      'utf-8'
    );

    // 保存 analysis.json
    if (analysisResult) {
      fs.writeFileSync(
        path.join(outputDir, 'analysis.json'),
        JSON.stringify(analysisResult, null, 2),
        'utf-8'
      );
    }

    // 计算总耗时
    let totalDuration = 0;
    if (startTime) {
      totalDuration = Math.round((now.getTime() - new Date(startTime).getTime()) / 1000);
    }

    // 保存 generation_log.json
    const generationLog = {
      productName,
      createdAt: now.toISOString(),
      model,
      aspectRatio,
      totalImages: images.length,
      successCount,
      failedCount,
      totalDuration,
      images: imageResults,
    };
    fs.writeFileSync(
      path.join(outputDir, 'generation_log.json'),
      JSON.stringify(generationLog, null, 2),
      'utf-8'
    );

    // 返回保存结果
    return NextResponse.json({
      success: true,
      outputPath: outputDir,
      folderName,
      successCount,
      failedCount,
      totalImages: images.length,
    });
  } catch (error) {
    console.error('Save Results API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '保存失败' },
      { status: 500 }
    );
  }
}
