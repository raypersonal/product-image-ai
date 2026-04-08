/**
 * 即梦AI视频生成API封装
 * 图生视频模式（3.0 1080P）
 */

import { sendSignedRequest } from '../volcEngine';

// API 版本
const API_VERSION = '2022-08-31';

// 视频模型配置
export const JIMENG_VIDEO_MODELS = {
  // 图生视频 3.0
  img2video: {
    reqKey: 'jimeng_vgfm_t2v_l20',  // 需确认实际值
    name: '即梦AI 视频3.0',
    desc: '1080P高清视频生成',
    resolution: '1080P',
  },
};

// 视频时长选项
export const VIDEO_DURATION_OPTIONS = [
  { value: 5, label: '5秒' },
  { value: 10, label: '10秒' },
];

interface JimengVideoRequest {
  prompt: string;
  imageBase64: string;  // 首帧图片 base64
  duration?: number;    // 时长秒数
}

interface JimengVideoResponse {
  code: number;
  message: string;
  request_id?: string;
  data?: {
    task_id?: string;
    video_url?: string;
    status?: 'processing' | 'success' | 'failed';
  };
}

interface VideoTaskStatus {
  status: 'pending' | 'processing' | 'success' | 'failed';
  progress?: number;
  videoUrl?: string;
  error?: string;
}

/**
 * 提交视频生成任务
 */
export async function submitVideoTask(
  accessKey: string,
  secretKey: string,
  request: JimengVideoRequest
): Promise<{ taskId: string; requestId: string }> {
  // 移除 base64 前缀（如果有）
  let imageBase64 = request.imageBase64;
  if (imageBase64.includes(',')) {
    imageBase64 = imageBase64.split(',')[1];
  }

  const body = {
    req_key: JIMENG_VIDEO_MODELS.img2video.reqKey,
    prompt: request.prompt,
    binary_data_base64: [imageBase64],
    video_duration: request.duration || 5,
    resolution: '1080p',
    return_url: true,
  };

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           JIMENG VIDEO 3.0 - SUBMIT TASK                    ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║ Duration: ${request.duration || 5}s`);
  console.log(`║ Resolution: 1080P`);
  console.log('║ Prompt:', request.prompt.substring(0, 80) + (request.prompt.length > 80 ? '...' : ''));
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
    console.error('❌ Jimeng Video API Error:', response.status, errorText);
    throw new Error(`即梦视频API请求失败: ${response.status} ${errorText}`);
  }

  const result: JimengVideoResponse = await response.json();

  if (result.code !== 10000) {
    console.error('❌ Jimeng Video API Error:', result.code, result.message);
    throw new Error(`即梦视频API错误: ${result.message} (code: ${result.code})`);
  }

  const taskId = result.data?.task_id;
  if (!taskId) {
    throw new Error('即梦视频API返回结果中无任务ID');
  }

  console.log(`✅ Video task submitted: ${taskId}`);
  return { taskId, requestId: result.request_id || '' };
}

/**
 * 查询视频任务状态
 */
export async function queryVideoTaskStatus(
  accessKey: string,
  secretKey: string,
  taskId: string
): Promise<VideoTaskStatus> {
  const body = {
    req_key: 'jimeng_vgfm_result',  // 查询结果的 req_key
    task_id: taskId,
  };

  const response = await sendSignedRequest(
    accessKey,
    secretKey,
    'CVProcess',
    API_VERSION,
    body
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Query Video Status Error:', response.status, errorText);
    return { status: 'failed', error: `查询失败: ${response.status}` };
  }

  const result: JimengVideoResponse = await response.json();

  if (result.code !== 10000) {
    // 可能是任务还在处理中
    if (result.code === 10001 || result.message?.includes('processing')) {
      return { status: 'processing', progress: 50 };
    }
    return { status: 'failed', error: result.message };
  }

  const status = result.data?.status;
  const videoUrl = result.data?.video_url;

  if (status === 'success' && videoUrl) {
    console.log('✅ Video generation completed!');
    return { status: 'success', videoUrl };
  }

  if (status === 'failed') {
    return { status: 'failed', error: '视频生成失败' };
  }

  return { status: 'processing', progress: 50 };
}

/**
 * 轮询等待视频生成完成
 */
export async function waitForVideoCompletion(
  accessKey: string,
  secretKey: string,
  taskId: string,
  onProgress?: (status: VideoTaskStatus) => void,
  maxWaitMs: number = 180000 // 最长等待3分钟
): Promise<string> {
  const startTime = Date.now();
  const pollInterval = 3000; // 每3秒查询一次

  while (Date.now() - startTime < maxWaitMs) {
    const status = await queryVideoTaskStatus(accessKey, secretKey, taskId);

    if (onProgress) {
      onProgress(status);
    }

    if (status.status === 'success' && status.videoUrl) {
      return status.videoUrl;
    }

    if (status.status === 'failed') {
      throw new Error(status.error || '视频生成失败');
    }

    // 等待后继续轮询
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('视频生成超时（超过3分钟）');
}

/**
 * 一键生成视频（提交+轮询）
 */
export async function generateVideo(
  accessKey: string,
  secretKey: string,
  request: JimengVideoRequest,
  onProgress?: (status: VideoTaskStatus) => void
): Promise<string> {
  // 1. 提交任务
  const { taskId } = await submitVideoTask(accessKey, secretKey, request);

  if (onProgress) {
    onProgress({ status: 'pending', progress: 10 });
  }

  // 2. 轮询等待完成
  return waitForVideoCompletion(accessKey, secretKey, taskId, onProgress);
}

/**
 * 检查视频API配置是否可用
 */
export function isVideoConfigured(): boolean {
  return !!(process.env.VOLC_ACCESS_KEY && process.env.VOLC_SECRET_KEY);
}
