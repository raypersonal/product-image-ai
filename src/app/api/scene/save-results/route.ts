import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const maxDuration = 60;

interface SceneImage {
  id: string;
  imageData: string;
  prompt: string;
  model: string;
  tags: string[];
  timestamp: number;
  size: string;
}

interface ProductImage {
  id: string;
  base64: string;
  filename: string;
  description: string;
}

interface SceneConfig {
  promptMode: string;
  outputSize: string;
  styleStrength: number;
  referenceWeight: number;
  platform: string;
  imageModel: string;
  selectedTags: string[];
}

interface SaveSceneRequest {
  productName: string;
  productInfo: {
    name: string;
    category: string;
    description: string;
  };
  history: SceneImage[];
  productImages: ProductImage[];
  config: SceneConfig;
}

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
    const matches = base64Url.match(/^data:image\/\w+;base64,(.+)$/);
    if (matches && matches[1]) {
      return Buffer.from(matches[1], 'base64');
    }
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

/**
 * 根据标签生成文件名
 */
function generateFilename(tags: string[], index: number): string {
  const tagPart = tags.length > 0
    ? tags.slice(0, 3).map(t => sanitizeFilename(t)).join('_')
    : 'scene';
  return `scene_${tagPart}_${String(index).padStart(2, '0')}.png`;
}

export async function POST(request: NextRequest) {
  try {
    const body: SaveSceneRequest = await request.json();
    const { productName, productInfo, history, productImages, config } = body;

    if (history.length === 0) {
      return NextResponse.json({ error: '没有可保存的图片' }, { status: 400 });
    }

    const now = new Date();
    const timestamp = formatTimestamp(now);
    const safeName = productName || productInfo.name || 'unnamed_product';
    const folderName = `${sanitizeFilename(safeName)}_${timestamp}_scene`;

    // 项目根目录下的 output 文件夹
    const outputDir = path.join(process.cwd(), 'output', folderName);
    const imagesDir = path.join(outputDir, 'images');
    const referencesDir = path.join(outputDir, 'references');

    // 创建目录
    fs.mkdirSync(imagesDir, { recursive: true });

    // 保存产品参考图
    if (productImages && productImages.length > 0) {
      fs.mkdirSync(referencesDir, { recursive: true });

      for (let i = 0; i < productImages.length; i++) {
        const refImg = productImages[i];
        const refBuffer = base64ToBuffer(refImg.base64);
        if (refBuffer) {
          const descPart = refImg.description
            ? `_${sanitizeFilename(refImg.description)}`
            : '';
          const refFilename = `ref_${String(i + 1).padStart(2, '0')}${descPart}.png`;
          fs.writeFileSync(path.join(referencesDir, refFilename), refBuffer);
        }
      }
    }

    // 保存生成的场景图
    let successCount = 0;
    let failedCount = 0;
    const promptsData: Array<{
      id: number;
      filename: string;
      prompt: string;
      model: string;
      tags: string[];
      size: string;
      timestamp: string;
      status: 'success' | 'failed';
      error?: string;
    }> = [];

    for (let i = 0; i < history.length; i++) {
      const image = history[i];
      const filename = generateFilename(image.tags, i + 1);
      const filePath = path.join(imagesDir, filename);

      let status: 'success' | 'failed' = 'failed';
      let error: string | undefined;

      try {
        let imageBuffer: Buffer | null = null;

        if (image.imageData.startsWith('data:image/')) {
          imageBuffer = base64ToBuffer(image.imageData);
        } else if (image.imageData.startsWith('http')) {
          imageBuffer = await downloadImage(image.imageData);
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

      promptsData.push({
        id: i + 1,
        filename,
        prompt: image.prompt,
        model: image.model,
        tags: image.tags,
        size: image.size,
        timestamp: new Date(image.timestamp).toISOString(),
        status,
        ...(error && { error }),
      });
    }

    // 保存 prompts.json
    fs.writeFileSync(
      path.join(outputDir, 'prompts.json'),
      JSON.stringify(promptsData, null, 2),
      'utf-8'
    );

    // 保存 scene_config.json
    const sceneConfig = {
      productName: safeName,
      productInfo,
      createdAt: now.toISOString(),
      totalImages: history.length,
      successCount,
      failedCount,
      config: {
        promptMode: config.promptMode,
        outputSize: config.outputSize,
        styleStrength: config.styleStrength,
        referenceWeight: config.referenceWeight,
        platform: config.platform,
        imageModel: config.imageModel,
        selectedTags: config.selectedTags,
      },
    };
    fs.writeFileSync(
      path.join(outputDir, 'scene_config.json'),
      JSON.stringify(sceneConfig, null, 2),
      'utf-8'
    );

    console.log(`✅ Scene results saved to: ${outputDir}`);
    console.log(`   - Images: ${successCount}/${history.length}`);
    console.log(`   - References: ${productImages.length}`);

    return NextResponse.json({
      success: true,
      outputPath: outputDir,
      folderName,
      successCount,
      failedCount,
      totalImages: history.length,
    });
  } catch (error) {
    console.error('Save Scene Results API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '保存失败' },
      { status: 500 }
    );
  }
}
