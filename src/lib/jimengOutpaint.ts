/**
 * 即梦AI扩图（Outpainting）API封装
 * 用于将图片扩展到指定宽高比
 */

import { sendSignedRequest } from './volcEngine';

// API 版本
const API_VERSION = '2022-08-31';

// 扩图模型配置（可配置，方便调试）
export const OUTPAINT_CONFIG = {
  reqKey: 'i2i_outpainting',  // 如报错尝试: jimeng_outpainting, jimeng_inpainting_edit
  fallbackReqKeys: ['jimeng_outpainting', 'i2i_inpainting_edit', 'jimeng_inpainting'],
};

// 视频宽高比配置
export const VIDEO_ASPECT_RATIOS = [
  { id: '16:9', label: '16:9 横屏', width: 1920, height: 1080, icon: '📺' },
  { id: '9:16', label: '9:16 竖屏', width: 1080, height: 1920, icon: '📱' },
  { id: '1:1', label: '1:1 方形', width: 1080, height: 1080, icon: '⬜' },
];

interface OutpaintRequest {
  imageBase64: string;  // 源图 base64
  targetAspectRatio: '16:9' | '9:16' | '1:1';  // 目标宽高比
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
 * 计算源图宽高比
 */
export function getImageAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  if (Math.abs(ratio - 16/9) < 0.1) return '16:9';
  if (Math.abs(ratio - 9/16) < 0.1) return '9:16';
  if (Math.abs(ratio - 1) < 0.1) return '1:1';
  if (ratio > 1.5) return '16:9';  // 宽图接近16:9
  if (ratio < 0.7) return '9:16';  // 竖图接近9:16
  return '1:1';  // 其他情况默认1:1
}

/**
 * 检查是否需要扩图
 */
export function needsOutpaint(
  sourceWidth: number,
  sourceHeight: number,
  targetAspectRatio: '16:9' | '9:16' | '1:1'
): boolean {
  const sourceRatio = getImageAspectRatio(sourceWidth, sourceHeight);
  return sourceRatio !== targetAspectRatio;
}

/**
 * 计算扩图后的尺寸和padding
 */
export function calculateOutpaintDimensions(
  sourceWidth: number,
  sourceHeight: number,
  targetAspectRatio: '16:9' | '9:16' | '1:1'
): {
  targetWidth: number;
  targetHeight: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
} {
  const targetConfig = VIDEO_ASPECT_RATIOS.find(r => r.id === targetAspectRatio)!;
  const targetRatio = targetConfig.width / targetConfig.height;
  const sourceRatio = sourceWidth / sourceHeight;

  let targetWidth: number;
  let targetHeight: number;
  let left = 0, top = 0, right = 0, bottom = 0;

  if (sourceRatio > targetRatio) {
    // 源图更宽，需要上下扩展
    targetWidth = sourceWidth;
    targetHeight = Math.round(sourceWidth / targetRatio);
    const extraHeight = targetHeight - sourceHeight;
    top = Math.floor(extraHeight / 2);
    bottom = extraHeight - top;
  } else if (sourceRatio < targetRatio) {
    // 源图更高，需要左右扩展
    targetHeight = sourceHeight;
    targetWidth = Math.round(sourceHeight * targetRatio);
    const extraWidth = targetWidth - sourceWidth;
    left = Math.floor(extraWidth / 2);
    right = extraWidth - left;
  } else {
    // 比例相同，无需扩展
    targetWidth = sourceWidth;
    targetHeight = sourceHeight;
  }

  // 确保不超过最大尺寸
  const maxDim = 2048;
  if (targetWidth > maxDim || targetHeight > maxDim) {
    const scale = maxDim / Math.max(targetWidth, targetHeight);
    targetWidth = Math.round(targetWidth * scale);
    targetHeight = Math.round(targetHeight * scale);
    left = Math.round(left * scale);
    top = Math.round(top * scale);
    right = Math.round(right * scale);
    bottom = Math.round(bottom * scale);
  }

  return { targetWidth, targetHeight, left, top, right, bottom };
}

/**
 * 执行扩图
 */
export async function jimengOutpaint(
  accessKey: string,
  secretKey: string,
  request: OutpaintRequest
): Promise<{ imageUrl: string; requestId: string }> {
  // 移除 base64 前缀（如果有）
  let imageBase64 = request.imageBase64;
  if (imageBase64.includes(',')) {
    imageBase64 = imageBase64.split(',')[1];
  }

  // 获取目标配置
  const targetConfig = VIDEO_ASPECT_RATIOS.find(r => r.id === request.targetAspectRatio)!;

  // 构建请求体
  const body = {
    req_key: OUTPAINT_CONFIG.reqKey,
    binary_data_base64: [imageBase64],
    prompt: request.prompt || 'seamlessly extend the image background, maintain consistent style and lighting',
    width: targetConfig.width,
    height: targetConfig.height,
    return_url: true,
  };

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           JIMENG OUTPAINT - EXTEND IMAGE                    ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║ req_key: ${OUTPAINT_CONFIG.reqKey}`);
  console.log(`║ Target: ${request.targetAspectRatio} (${targetConfig.width}×${targetConfig.height})`);
  console.log('║ Prompt:', (request.prompt || 'default').substring(0, 60));
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const response = await sendSignedRequest(
    accessKey,
    secretKey,
    'CVProcess',
    API_VERSION,
    body
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Jimeng Outpaint API Error:', response.status, errorText);
    // 记录详细错误，方便调试req_key
    console.error('❌ Used req_key:', OUTPAINT_CONFIG.reqKey);
    console.error('❌ Fallback options:', OUTPAINT_CONFIG.fallbackReqKeys.join(', '));
    throw new Error(`即梦扩图API请求失败: ${response.status} ${errorText}`);
  }

  const result: OutpaintResponse = await response.json();

  if (result.code !== 10000) {
    console.error('❌ Jimeng Outpaint API Error:', result.code, result.message);
    console.error('❌ Full response:', JSON.stringify(result));
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
