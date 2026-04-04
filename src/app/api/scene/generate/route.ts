import { NextRequest, NextResponse } from 'next/server';
import { isDashScopeModel, convertAspectRatioToDashScope } from '@/types';

export const maxDuration = 120;

// DashScope 图片生成 API（异步）
const DASHSCOPE_IMAGE_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';
const DASHSCOPE_TASK_URL = 'https://dashscope.aliyuncs.com/api/v1/tasks';

interface DashScopeTaskResponse {
  request_id?: string;
  output?: {
    task_id?: string;
    task_status?: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
    results?: Array<{
      url?: string;
      b64_image?: string;
    }>;
    message?: string;
    code?: string;
  };
}

/**
 * 使用 DashScope 生成图片
 */
async function generateWithDashScope(
  prompt: string,
  model: string,
  aspectRatio: string,
  apiKey: string
): Promise<string> {
  const size = convertAspectRatioToDashScope(aspectRatio);

  console.log(`=== DashScope Scene Generation ===`);
  console.log(`Model: ${model}, AspectRatio: ${aspectRatio} → Size: ${size}`);

  // Step 1: 提交异步任务
  const createResponse = await fetch(DASHSCOPE_IMAGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model,
      input: { prompt },
      parameters: { size, n: 1 },
    }),
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json().catch(() => ({}));
    throw new Error(`百炼任务创建失败：${errorData.message || createResponse.statusText}`);
  }

  const createData: DashScopeTaskResponse = await createResponse.json();
  const taskId = createData.output?.task_id;

  if (!taskId) {
    throw new Error('百炼任务ID获取失败');
  }

  console.log(`Task created: ${taskId}`);

  // Step 2: 轮询任务状态
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const statusResponse = await fetch(`${DASHSCOPE_TASK_URL}/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!statusResponse.ok) continue;

    const statusData: DashScopeTaskResponse = await statusResponse.json();
    const status = statusData.output?.task_status;

    console.log(`Task ${taskId} status: ${status} (attempt ${i + 1})`);

    if (status === 'SUCCEEDED') {
      const results = statusData.output?.results;
      if (results && results.length > 0) {
        const imageUrl = results[0].url || results[0].b64_image;
        if (imageUrl) {
          console.log('Image generated successfully');
          return imageUrl;
        }
      }
      throw new Error('图片生成成功但无法获取结果');
    }

    if (status === 'FAILED') {
      throw new Error(`图片生成失败：${statusData.output?.message || '未知错误'}`);
    }
  }

  throw new Error('图片生成超时');
}

/**
 * 使用 OpenRouter 生成图片
 */
async function generateWithOpenRouter(
  prompt: string,
  model: string,
  aspectRatio: string,
  apiKey: string
): Promise<string> {
  console.log(`=== OpenRouter Scene Generation ===`);
  console.log(`Model: ${model}, AspectRatio: ${aspectRatio}`);

  // 根据宽高比计算尺寸
  const sizeMap: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },
    '4:3': { width: 1024, height: 768 },
    '3:4': { width: 768, height: 1024 },
    '16:9': { width: 1280, height: 720 },
    '9:16': { width: 720, height: 1280 },
    '21:9': { width: 1260, height: 540 },
  };

  const size = sizeMap[aspectRatio] || sizeMap['1:1'];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Product Image AI - Scene Workbench',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      provider: {
        sort: 'throughput',
      },
      // FLUX 模型特定参数
      ...(model.includes('flux') && {
        extra_body: {
          width: size.width,
          height: size.height,
        },
      }),
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();

  // 尝试从不同位置获取图片
  const content = data.choices?.[0]?.message?.content;
  const images = data.choices?.[0]?.message?.images;

  if (images && images.length > 0) {
    return images[0].image_url?.url || images[0].url || images[0];
  }

  if (content && (content.startsWith('http') || content.startsWith('data:'))) {
    return content;
  }

  throw new Error('无法从 OpenRouter 响应中提取图片');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      model,
      aspectRatio,
      platform,
    } = body as {
      prompt: string;
      model: string;
      aspectRatio: string;
      platform: 'dashscope' | 'openrouter';
    };

    if (!prompt) {
      return NextResponse.json(
        { error: '请提供图片生成提示词' },
        { status: 400 }
      );
    }

    const selectedModel = model || 'wanx2.1-t2i-turbo';
    const selectedAspectRatio = aspectRatio || '1:1';
    const selectedPlatform = platform || (isDashScopeModel(selectedModel) ? 'dashscope' : 'openrouter');

    console.log(`=== Scene Generate API ===`);
    console.log(`Platform: ${selectedPlatform}, Model: ${selectedModel}, AspectRatio: ${selectedAspectRatio}`);

    let imageUrl: string;

    if (selectedPlatform === 'dashscope') {
      const apiKey = process.env.DASHSCOPE_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: '请配置 DASHSCOPE_API_KEY' },
          { status: 400 }
        );
      }
      imageUrl = await generateWithDashScope(prompt, selectedModel, selectedAspectRatio, apiKey);
    } else {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: '请配置 OPENROUTER_API_KEY' },
          { status: 400 }
        );
      }
      imageUrl = await generateWithOpenRouter(prompt, selectedModel, selectedAspectRatio, apiKey);
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      model: selectedModel,
      aspectRatio: selectedAspectRatio,
      platform: selectedPlatform,
    });
  } catch (error) {
    console.error('Scene Generate API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '图片生成失败' },
      { status: 500 }
    );
  }
}
