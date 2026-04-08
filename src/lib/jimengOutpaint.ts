/**
 * 即梦AI扩图（Outpainting）API封装
 * 用于将图片扩展到指定宽高比
 *
 * 注意：此文件使用 sharp 库，只能在服务端（API路由）中使用
 *
 * API参数说明：
 * - req_key: "jimeng_image2image_dream_inpaint"
 * - binary_data_base64: [原图(居中放置在扩展画布), mask图(黑=保留,白=重绘)]
 * - prompt: 扩展区域描述
 */

import { sendSignedRequest } from './volcEngine';
import { VideoAspectRatio } from './videoAspectRatio';
import { stripBase64Prefix } from './base64Utils';
import sharp from 'sharp';

// API 版本
const API_VERSION = '2022-08-31';

// 扩图模型配置
export const OUTPAINT_CONFIG = {
  reqKey: 'jimeng_image2image_dream_inpaint',
};

interface OutpaintRequest {
  imageBase64: string;  // 源图 base64
  targetAspectRatio: VideoAspectRatio;  // 目标宽高比
  prompt?: string;  // 扩展区域的描述
}

interface OutpaintResponse {
  code: number;
  message: string;
  request_id?: string;
  data?: {
    binary_data_base64?: string[];
    image_urls?: string[];
  };
}

/**
 * 创建扩展画布和mask图
 * @param sourceBase64 源图base64
 * @param targetAspectRatio 目标宽高比
 * @returns { expandedImage, maskImage } 都是base64格式（不含前缀）
 */
async function createExpandedCanvasAndMask(
  sourceBase64: string,
  targetAspectRatio: VideoAspectRatio
): Promise<{ expandedImageBase64: string; maskBase64: string; targetWidth: number; targetHeight: number }> {
  // 移除 base64 前缀（使用工具函数）
  const base64Data = stripBase64Prefix(sourceBase64);

  // 解码源图获取尺寸
  const sourceBuffer = Buffer.from(base64Data, 'base64');
  const sourceImage = sharp(sourceBuffer);
  const metadata = await sourceImage.metadata();
  const sourceWidth = metadata.width!;
  const sourceHeight = metadata.height!;

  console.log(`>>> Source image: ${sourceWidth}×${sourceHeight}`);

  // 计算目标尺寸（保持源图较短边不变，扩展较长边）
  const targetRatioValue = targetAspectRatio === '16:9' ? 16/9 : targetAspectRatio === '9:16' ? 9/16 : 1;
  const sourceRatio = sourceWidth / sourceHeight;

  let targetWidth: number;
  let targetHeight: number;

  if (sourceRatio < targetRatioValue) {
    // 源图更竖，需要左右扩展
    targetHeight = sourceHeight;
    targetWidth = Math.round(sourceHeight * targetRatioValue);
  } else {
    // 源图更宽，需要上下扩展
    targetWidth = sourceWidth;
    targetHeight = Math.round(sourceWidth / targetRatioValue);
  }

  // 确保尺寸为偶数
  targetWidth = Math.round(targetWidth / 2) * 2;
  targetHeight = Math.round(targetHeight / 2) * 2;

  // 计算源图在目标画布中的位置（居中）
  const left = Math.floor((targetWidth - sourceWidth) / 2);
  const top = Math.floor((targetHeight - sourceHeight) / 2);

  console.log(`>>> Target canvas: ${targetWidth}×${targetHeight}`);
  console.log(`>>> Source position: left=${left}, top=${top}`);

  // 1. 创建扩展画布（源图居中，周围用边缘像素填充或透明）
  // 使用 extend 方法扩展画布
  const expandedImageBuffer = await sharp(sourceBuffer)
    .extend({
      top: top,
      bottom: targetHeight - sourceHeight - top,
      left: left,
      right: targetWidth - sourceWidth - left,
      background: { r: 128, g: 128, b: 128, alpha: 1 }  // 灰色背景
    })
    .png()
    .toBuffer();

  // 2. 创建mask图：源图区域黑色(0)，扩展区域白色(255)
  // 先创建全白画布
  const whiteCanvas = await sharp({
    create: {
      width: targetWidth,
      height: targetHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 }
    }
  }).png().toBuffer();

  // 创建黑色矩形（源图区域）
  const blackRect = await sharp({
    create: {
      width: sourceWidth,
      height: sourceHeight,
      channels: 3,
      background: { r: 0, g: 0, b: 0 }
    }
  }).png().toBuffer();

  // 将黑色矩形合成到白色画布上
  const maskBuffer = await sharp(whiteCanvas)
    .composite([{
      input: blackRect,
      left: left,
      top: top
    }])
    .png()
    .toBuffer();

  const expandedImageBase64 = expandedImageBuffer.toString('base64');
  const maskBase64 = maskBuffer.toString('base64');

  console.log(`>>> Expanded image base64 length: ${expandedImageBase64.length}`);
  console.log(`>>> Mask image base64 length: ${maskBase64.length}`);

  return { expandedImageBase64, maskBase64, targetWidth, targetHeight };
}

/**
 * 执行扩图
 */
export async function jimengOutpaint(
  accessKey: string,
  secretKey: string,
  request: OutpaintRequest
): Promise<{ imageUrl: string; requestId: string }> {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           JIMENG OUTPAINT - PREPARING IMAGES                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // 创建扩展画布和mask
  const { expandedImageBase64, maskBase64, targetWidth, targetHeight } = await createExpandedCanvasAndMask(
    request.imageBase64,
    request.targetAspectRatio
  );

  // 构建请求体
  const body = {
    req_key: OUTPAINT_CONFIG.reqKey,
    binary_data_base64: [expandedImageBase64, maskBase64],  // [原图居中放置, mask]
    prompt: request.prompt || 'extend the background naturally, seamless continuation of the scene, consistent lighting and style',
    return_url: true,
  };

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           JIMENG OUTPAINT - CALLING API                      ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║ req_key: ${OUTPAINT_CONFIG.reqKey}`);
  console.log(`║ Target: ${request.targetAspectRatio} (${targetWidth}×${targetHeight})`);
  console.log(`║ Prompt: ${(body.prompt).substring(0, 60)}`);
  console.log(`║ Images count: ${body.binary_data_base64.length}`);
  console.log(`║ Image 1 (expanded): ${expandedImageBase64.length} chars`);
  console.log(`║ Image 2 (mask): ${maskBase64.length} chars`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const response = await sendSignedRequest(
    accessKey,
    secretKey,
    'CVProcess',
    API_VERSION,
    body
  );

  const responseText = await response.text();
  console.log('\n>>> API Response Status:', response.status);
  console.log('>>> API Response Body:', responseText.substring(0, 500));

  if (!response.ok) {
    console.error('\n╔════════════════════════════════════════════════════════════╗');
    console.error('║           ❌ OUTPAINT API ERROR                              ║');
    console.error('╠════════════════════════════════════════════════════════════╣');
    console.error(`║ HTTP Status: ${response.status}`);
    console.error(`║ Used req_key: ${OUTPAINT_CONFIG.reqKey}`);
    console.error('║ Response:', responseText.substring(0, 300));
    console.error('╚════════════════════════════════════════════════════════════╝\n');
    throw new Error(`即梦扩图API请求失败: ${response.status} - ${responseText}`);
  }

  let result: OutpaintResponse;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(`即梦扩图API返回非JSON: ${responseText.substring(0, 200)}`);
  }

  if (result.code !== 10000) {
    console.error('\n╔════════════════════════════════════════════════════════════╗');
    console.error('║           ❌ OUTPAINT API BUSINESS ERROR                     ║');
    console.error('╠════════════════════════════════════════════════════════════╣');
    console.error(`║ Code: ${result.code}`);
    console.error(`║ Message: ${result.message}`);
    console.error(`║ Used req_key: ${OUTPAINT_CONFIG.reqKey}`);
    console.error('║ Full response:', JSON.stringify(result));
    console.error('╚════════════════════════════════════════════════════════════╝\n');
    throw new Error(`即梦扩图API错误: ${result.message} (code: ${result.code})`);
  }

  // 优先使用 URL，其次使用 base64
  const imageUrl = result.data?.image_urls?.[0];
  const imageBase64Result = result.data?.binary_data_base64?.[0];

  if (imageUrl) {
    console.log('✅ Jimeng outpaint completed successfully (URL)');
    return { imageUrl, requestId: result.request_id || '' };
  }

  if (imageBase64Result) {
    console.log('✅ Jimeng outpaint completed successfully (base64)');
    return {
      imageUrl: `data:image/png;base64,${imageBase64Result}`,
      requestId: result.request_id || '',
    };
  }

  throw new Error('即梦扩图API返回结果中无图片数据');
}
