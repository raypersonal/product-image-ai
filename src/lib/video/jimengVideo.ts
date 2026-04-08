/**
 * 即梦AI视频生成API封装
 * 图生视频模式（3.0 1080P）
 */

import { sendSignedRequest } from '../volcEngine';
import { ensurePureBase64 } from '../base64Utils';

// API 版本
const API_VERSION = '2022-08-31';

// 视频模型配置
export const JIMENG_VIDEO_MODELS = {
  // 图生视频 3.0 (1080P)
  img2video: {
    reqKey: 'jimeng_i2v_first_v30_1080',
    name: '即梦AI 图生视频3.0',
    desc: '1080P高清视频生成',
    resolution: '1080P',
  },
  // 文生视频 3.0 (1080P)
  text2video: {
    reqKey: 'jimeng_t2v_v30_1080p',
    name: '即梦AI 文生视频3.0',
    desc: '1080P文字生成视频',
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
    video_urls?: string[];
    status?: string;
    resp_data?: Record<string, unknown>;
    [key: string]: unknown;  // 允许其他未知字段
  };
}

interface VideoTaskStatus {
  status: 'pending' | 'processing' | 'success' | 'failed';
  progress?: number;
  videoUrl?: string;
  error?: string;
}

/**
 * 计算帧数：5秒=121帧，10秒=241帧（帧数=24*秒数+1）
 */
function durationToFrames(seconds: number): number {
  return 24 * seconds + 1;
}

/**
 * 提交视频生成任务
 * 返回值可能包含 videoUrl（同步模式）或 taskId（异步模式）
 */
export async function submitVideoTask(
  accessKey: string,
  secretKey: string,
  request: JimengVideoRequest
): Promise<{ taskId?: string; requestId: string; videoUrl?: string }> {
  // 确保是纯 base64（支持 data URL、远程 URL、纯 base64）
  const imageBase64 = await ensurePureBase64(request.imageBase64);

  // 计算帧数
  const duration = request.duration || 5;
  const frames = durationToFrames(duration);

  // 截断 prompt 到 800 字符以内
  const prompt = request.prompt.length > 800
    ? request.prompt.substring(0, 800)
    : request.prompt;

  // 按官方文档构建请求体
  const body = {
    req_key: JIMENG_VIDEO_MODELS.img2video.reqKey,
    binary_data_base64: [imageBase64],
    prompt: prompt,
    seed: -1,
    frames: frames,
  };

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           JIMENG VIDEO 3.0 - SUBMIT TASK                    ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║ req_key: ${JIMENG_VIDEO_MODELS.img2video.reqKey}`);
  console.log(`║ Duration: ${duration}s → Frames: ${frames}`);
  console.log(`║ Image size: ${imageBase64.length} chars`);
  console.log(`║ Prompt (${prompt.length} chars):`, prompt.substring(0, 80) + (prompt.length > 80 ? '...' : ''));
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const response = await sendSignedRequest(
    accessKey,
    secretKey,
    'CVProcess',
    API_VERSION,
    body
  );

  const responseText = await response.text();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           JIMENG VIDEO API - RESPONSE                       ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║ HTTP Status:', response.status);
  console.log('║ Full Response:');
  console.log(responseText);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (!response.ok) {
    console.error('❌ Jimeng Video API Error:', response.status, responseText);
    throw new Error(`即梦视频API请求失败: ${response.status} ${responseText}`);
  }

  let result: JimengVideoResponse;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(`即梦视频API返回非JSON: ${responseText.substring(0, 200)}`);
  }

  // 打印解析后的结构
  console.log('>>> Parsed result structure:');
  console.log('>>> result.code:', result.code);
  console.log('>>> result.message:', result.message);
  console.log('>>> result.data:', JSON.stringify(result.data, null, 2));
  console.log('>>> result.request_id:', result.request_id);

  if (result.code !== 10000) {
    console.error('❌ Jimeng Video API Error:', result.code, result.message);
    throw new Error(`即梦视频API错误: ${result.message} (code: ${result.code})`);
  }

  // 解析响应数据
  const data = result.data as Record<string, unknown>;

  // 检查是否同步返回了视频URL（data.urls）
  const urls = data?.urls as string[] | undefined;
  if (urls && urls.length > 0) {
    console.log('✅ Video generated synchronously!');
    console.log('>>> Video URL:', urls[0]);
    return { requestId: result.request_id || '', videoUrl: urls[0] };
  }

  // 异步模式：查找 task_id
  let taskId = data?.task_id as string | undefined;

  if (!taskId && data?.resp_data) {
    const respData = data.resp_data as Record<string, unknown>;
    taskId = respData?.task_id as string | undefined;
    console.log('>>> Found task_id in resp_data:', taskId);
  }

  if (!taskId) {
    taskId = data?.taskId as string | undefined;
    if (taskId) console.log('>>> Found taskId (camelCase):', taskId);
  }

  if (!taskId) {
    console.error('❌ Cannot find task_id or urls in response. Full data:', JSON.stringify(data, null, 2));
    throw new Error('即梦视频API返回结果中无任务ID或视频URL');
  }

  console.log(`✅ Video task submitted (async mode): ${taskId}`);
  return { taskId, requestId: result.request_id || '' };
}

/**
 * 查询视频任务状态
 * 注意：查询时 req_key 与提交时相同
 */
export async function queryVideoTaskStatus(
  accessKey: string,
  secretKey: string,
  taskId: string
): Promise<VideoTaskStatus> {
  const body = {
    req_key: JIMENG_VIDEO_MODELS.img2video.reqKey,  // 与提交任务相同的 req_key
    task_id: taskId,
  };

  console.log(`\n>>> Querying video task: ${taskId}`);
  console.log(`>>> Query req_key: ${body.req_key}`);

  const response = await sendSignedRequest(
    accessKey,
    secretKey,
    'CVProcess',
    API_VERSION,
    body
  );

  const responseText = await response.text();
  console.log('>>> Query Response:', responseText);

  if (!response.ok) {
    console.error('❌ Query Video Status Error:', response.status, responseText);
    return { status: 'failed', error: `查询失败: ${response.status}` };
  }

  let result: JimengVideoResponse;
  try {
    result = JSON.parse(responseText);
  } catch {
    console.error('❌ Query response is not JSON:', responseText);
    return { status: 'failed', error: '查询返回非JSON' };
  }

  console.log('>>> Query result.code:', result.code);
  console.log('>>> Query result.data:', JSON.stringify(result.data, null, 2));

  if (result.code !== 10000) {
    // 可能是任务还在处理中
    if (result.code === 10001 || result.message?.includes('processing')) {
      return { status: 'processing', progress: 50 };
    }
    return { status: 'failed', error: result.message };
  }

  // 尝试多种可能的字段位置
  const data = result.data as Record<string, unknown>;
  const status = data?.status as string | undefined;
  const videoUrls = data?.video_urls as string[] | undefined;
  const videoUrl = (data?.video_url as string | undefined) || videoUrls?.[0];

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
 * 一键生成视频（支持同步和异步两种模式）
 */
export async function generateVideo(
  accessKey: string,
  secretKey: string,
  request: JimengVideoRequest,
  onProgress?: (status: VideoTaskStatus) => void
): Promise<string> {
  // 1. 提交任务
  const result = await submitVideoTask(accessKey, secretKey, request);

  // 同步模式：视频URL直接返回
  if (result.videoUrl) {
    console.log('>>> Sync mode: Video URL returned directly');
    if (onProgress) {
      onProgress({ status: 'success', progress: 100, videoUrl: result.videoUrl });
    }
    return result.videoUrl;
  }

  // 异步模式：需要轮询 task_id
  if (!result.taskId) {
    throw new Error('视频生成失败：既无视频URL也无任务ID');
  }

  console.log('>>> Async mode: Polling for task_id:', result.taskId);
  if (onProgress) {
    onProgress({ status: 'pending', progress: 10 });
  }

  // 2. 轮询等待完成
  return waitForVideoCompletion(accessKey, secretKey, result.taskId, onProgress);
}

/**
 * 检查视频API配置是否可用
 */
export function isVideoConfigured(): boolean {
  return !!(process.env.VOLC_ACCESS_KEY && process.env.VOLC_SECRET_KEY);
}
