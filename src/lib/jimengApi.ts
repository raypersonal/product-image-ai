/**
 * 即梦AI（火山引擎）图片生成API封装
 * 支持文生图（4.0）和图生图（3.0智能参考）
 */

import { sendSignedRequest } from './volcEngine';
import { stripBase64Prefix } from './base64Utils';

// API 版本
const API_VERSION = '2022-08-31';

// 模型配置
export const JIMENG_MODELS = {
  // 文生图 4.6（最新版本，优先推荐）
  text2img_v46: {
    reqKey: 'jimeng_high_aes_general_v46',  // 如报错尝试: jimeng_t2i_v46
    modelVersion: 'general_v4.6',
    name: '即梦AI 4.6',
    desc: '最新高美感模型',
  },
  // 文生图 4.0
  text2img: {
    reqKey: 'jimeng_high_aes_general_v21_L',
    modelVersion: 'general_v2.1_L',
    name: '即梦AI 4.0',
    desc: '高美感通用模型',
  },
  // 图生图 3.0 智能参考
  img2img: {
    reqKey: 'i2i_inpainting_edit',
    name: '即梦AI 3.0 图生图',
    desc: '智能参考，保持产品一致性',
  },
};

// 尺寸映射
const SIZE_MAP: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '4:3': { width: 1024, height: 768 },
  '3:4': { width: 768, height: 1024 },
  '16:9': { width: 1280, height: 720 },
  '9:16': { width: 720, height: 1280 },
  '21:9': { width: 1260, height: 540 },
  '2:1': { width: 1024, height: 512 },
  '3:2': { width: 1024, height: 683 },
};

interface JimengText2ImgRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string;
  width?: number;
  height?: number;
  modelVersion?: '4.0' | '4.6';  // 模型版本，默认4.0
}

interface JimengImg2ImgRequest {
  prompt: string;
  negativePrompt?: string;
  imageBase64: string;  // 参考图 base64（不含 data:image/xxx;base64, 前缀）
  strength?: number;    // 参考强度 0-1
  aspectRatio?: string;
}

interface JimengResponse {
  code: number;
  message: string;
  request_id?: string;
  data?: {
    binary_data_base64?: string[];
    image_urls?: string[];
  };
}

/**
 * 文生图（即梦AI 4.0 / 4.6）
 */
export async function jimengText2Img(
  accessKey: string,
  secretKey: string,
  request: JimengText2ImgRequest
): Promise<{ imageUrl: string; requestId: string }> {
  // 解析尺寸
  let width = request.width || 1024;
  let height = request.height || 1024;

  if (request.aspectRatio && SIZE_MAP[request.aspectRatio]) {
    const size = SIZE_MAP[request.aspectRatio];
    width = size.width;
    height = size.height;
  }

  // 选择模型配置
  const modelConfig = request.modelVersion === '4.6'
    ? JIMENG_MODELS.text2img_v46
    : JIMENG_MODELS.text2img;

  const body = {
    req_key: modelConfig.reqKey,
    prompt: request.prompt,
    model_version: modelConfig.modelVersion,
    return_url: true,
    width,
    height,
    ...(request.negativePrompt && { negative_prompt: request.negativePrompt }),
  };

  const modelName = request.modelVersion === '4.6' ? '4.6' : '4.0';
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log(`║           JIMENG AI ${modelName} - TEXT TO IMAGE                     ║`);
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║ Model: ${modelConfig.reqKey}`);
  console.log(`║ Size: ${width}×${height}`);
  console.log('║ Prompt:', request.prompt.substring(0, 100) + (request.prompt.length > 100 ? '...' : ''));
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
    console.error('❌ Jimeng API Error:', response.status, errorText);
    throw new Error(`即梦API请求失败: ${response.status} ${errorText}`);
  }

  const result: JimengResponse = await response.json();

  if (result.code !== 10000) {
    console.error('❌ Jimeng API Error:', result.code, result.message);
    throw new Error(`即梦API错误: ${result.message} (code: ${result.code})`);
  }

  // 优先使用 URL，其次使用 base64
  const imageUrl = result.data?.image_urls?.[0];
  const imageBase64 = result.data?.binary_data_base64?.[0];

  if (imageUrl) {
    console.log('✅ Jimeng image generated successfully (URL)');
    return { imageUrl, requestId: result.request_id || '' };
  }

  if (imageBase64) {
    console.log('✅ Jimeng image generated successfully (base64)');
    return {
      imageUrl: `data:image/png;base64,${imageBase64}`,
      requestId: result.request_id || '',
    };
  }

  throw new Error('即梦API返回结果中无图片数据');
}

/**
 * 图生图（即梦AI 3.0 智能参考）
 */
export async function jimengImg2Img(
  accessKey: string,
  secretKey: string,
  request: JimengImg2ImgRequest
): Promise<{ imageUrl: string; requestId: string }> {
  // 解析尺寸
  let width = 1024;
  let height = 1024;

  if (request.aspectRatio && SIZE_MAP[request.aspectRatio]) {
    const size = SIZE_MAP[request.aspectRatio];
    width = size.width;
    height = size.height;
  }

  // 移除 base64 前缀（使用工具函数）
  const imageBase64 = stripBase64Prefix(request.imageBase64);

  const body = {
    req_key: JIMENG_MODELS.img2img.reqKey,
    prompt: request.prompt,
    binary_data_base64: [imageBase64],
    return_url: true,
    width,
    height,
    ...(request.negativePrompt && { negative_prompt: request.negativePrompt }),
    ...(request.strength !== undefined && { strength: request.strength }),
  };

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           JIMENG AI 3.0 - IMAGE TO IMAGE                    ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║ Size: ${width}×${height}`);
  console.log(`║ Strength: ${request.strength || 'default'}`);
  console.log('║ Prompt:', request.prompt.substring(0, 100) + (request.prompt.length > 100 ? '...' : ''));
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
    console.error('❌ Jimeng Img2Img API Error:', response.status, errorText);
    throw new Error(`即梦图生图API请求失败: ${response.status} ${errorText}`);
  }

  const result: JimengResponse = await response.json();

  if (result.code !== 10000) {
    console.error('❌ Jimeng Img2Img API Error:', result.code, result.message);
    throw new Error(`即梦图生图API错误: ${result.message} (code: ${result.code})`);
  }

  // 优先使用 URL，其次使用 base64
  const imageUrl = result.data?.image_urls?.[0];
  const imageBase64Result = result.data?.binary_data_base64?.[0];

  if (imageUrl) {
    console.log('✅ Jimeng img2img generated successfully (URL)');
    return { imageUrl, requestId: result.request_id || '' };
  }

  if (imageBase64Result) {
    console.log('✅ Jimeng img2img generated successfully (base64)');
    return {
      imageUrl: `data:image/png;base64,${imageBase64Result}`,
      requestId: result.request_id || '',
    };
  }

  throw new Error('即梦图生图API返回结果中无图片数据');
}

/**
 * 检查即梦API配置是否可用
 */
export function isJimengConfigured(): boolean {
  return !!(process.env.VOLC_ACCESS_KEY && process.env.VOLC_SECRET_KEY);
}
