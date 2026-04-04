import { NextRequest, NextResponse } from 'next/server';
import { isDashScopeModel, convertAspectRatioToDashScope } from '@/types';

// DashScope 图片生成 API（异步）
const DASHSCOPE_IMAGE_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';
const DASHSCOPE_TASK_URL = 'https://dashscope.aliyuncs.com/api/v1/tasks';

interface ImageBlock {
  type: string;
  image_url?: {
    url: string;
  };
}

interface OpenRouterImageResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | null;
      images?: ImageBlock[];
    };
  }>;
}

interface DashScopeTaskResponse {
  request_id?: string;
  output?: {
    task_id?: string;
    task_status?: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
    results?: Array<{
      url?: string;
      b64_image?: string;
    }>;
    task_metrics?: {
      TOTAL?: number;
      SUCCEEDED?: number;
      FAILED?: number;
    };
    message?: string;
    code?: string;
  };
}

/**
 * 使用 DashScope 生成图片（异步任务模式）
 */
async function generateWithDashScope(
  prompt: string,
  model: string,
  aspectRatio: string,
  apiKey: string
): Promise<string> {
  const size = convertAspectRatioToDashScope(aspectRatio);

  console.log(`=== DashScope Image Generation ===`);
  console.log(`Model: ${model}, Size: ${size}`);

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
      input: {
        prompt,
      },
      parameters: {
        size,
        n: 1,
      },
    }),
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json().catch(() => ({}));
    console.error('DashScope Create Task Error:', errorData);
    throw new Error(`百炼任务创建失败：${errorData.message || createResponse.statusText}`);
  }

  const createData: DashScopeTaskResponse = await createResponse.json();
  const taskId = createData.output?.task_id;

  if (!taskId) {
    console.error('DashScope response:', createData);
    throw new Error('百炼任务ID获取失败');
  }

  console.log(`Task created: ${taskId}`);

  // Step 2: 轮询任务状态
  const maxAttempts = 60; // 最多等待 60 秒
  const pollInterval = 1000; // 每秒轮询一次

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));

    const statusResponse = await fetch(`${DASHSCOPE_TASK_URL}/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!statusResponse.ok) {
      console.error(`Task status check failed (attempt ${attempt + 1})`);
      continue;
    }

    const statusData: DashScopeTaskResponse = await statusResponse.json();
    const taskStatus = statusData.output?.task_status;

    console.log(`Task ${taskId} status: ${taskStatus} (attempt ${attempt + 1})`);

    if (taskStatus === 'SUCCEEDED') {
      const results = statusData.output?.results;
      if (results && results.length > 0) {
        const imageUrl = results[0].url || (results[0].b64_image ? `data:image/png;base64,${results[0].b64_image}` : null);
        if (imageUrl) {
          console.log(`Image generated successfully`);
          return imageUrl;
        }
      }
      throw new Error('百炼图片生成成功但未返回图片URL');
    }

    if (taskStatus === 'FAILED') {
      const message = statusData.output?.message || '未知错误';
      throw new Error(`百炼图片生成失败：${message}`);
    }

    // PENDING or RUNNING - continue polling
  }

  throw new Error('百炼图片生成超时');
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
  const requestBody: Record<string, unknown> = {
    model: model || 'black-forest-labs/flux.2-flex',
    messages: [{ role: 'user', content: prompt }],
    modalities: ['image'],
  };

  if (aspectRatio) {
    requestBody.image_config = {
      aspect_ratio: aspectRatio,
    };
  }

  console.log('=== OpenRouter Image Generation ===');
  console.log(`Model: ${requestBody.model}, Aspect Ratio: ${aspectRatio || 'default'}`);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Product Image AI',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('OpenRouter API Error:', errorData);
    throw new Error(`图片生成失败：${errorData.error?.message || response.statusText}`);
  }

  const data: OpenRouterImageResponse = await response.json();

  let imageUrl: string | null = null;

  // 方法1: 从 choices[0].message.images 获取
  const messageImages = data.choices?.[0]?.message?.images;
  if (messageImages && Array.isArray(messageImages) && messageImages.length > 0) {
    const imageBlock = messageImages.find(img => img.type === 'image_url');
    if (imageBlock && imageBlock.image_url?.url) {
      imageUrl = imageBlock.image_url.url;
      console.log('Found image in message.images');
    }
  }

  // 方法2: 从 content 数组里找
  if (!imageUrl) {
    const content = data.choices?.[0]?.message?.content;
    if (Array.isArray(content)) {
      const imageBlock = (content as ImageBlock[]).find(block => block.type === 'image_url');
      if (imageBlock && imageBlock.image_url?.url) {
        imageUrl = imageBlock.image_url.url;
        console.log('Found image in message.content array');
      }
    } else if (typeof content === 'string') {
      if (content.startsWith('data:image/')) {
        imageUrl = content;
        console.log('Found image as data URL string in content');
      }
      const urlMatch = content.match(/https?:\/\/[^\s"<>]+\.(png|jpg|jpeg|webp)/i);
      if (urlMatch) {
        imageUrl = urlMatch[0];
        console.log('Found image URL in content string');
      }
    }
  }

  if (!imageUrl) {
    console.error('No image URL found in response:', JSON.stringify(data, null, 2));
    throw new Error('未能获取生成的图片URL');
  }

  return imageUrl;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model, aspectRatio } = body as {
      prompt: string;
      model: string;
      aspectRatio?: string;
      apiKey?: string;
    };

    // API Keys
    const openRouterKey = process.env.OPENROUTER_API_KEY || body.apiKey;
    const dashScopeKey = process.env.DASHSCOPE_API_KEY;

    const isDashScope = isDashScopeModel(model);
    const apiKey = isDashScope ? dashScopeKey : openRouterKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: isDashScope ? '请先配置 DASHSCOPE_API_KEY' : '请先配置 OpenRouter API Key' },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: '缺少图片Prompt' },
        { status: 400 }
      );
    }

    let imageUrl: string;

    if (isDashScope) {
      imageUrl = await generateWithDashScope(prompt, model, aspectRatio || '1:1', apiKey);
    } else {
      imageUrl = await generateWithOpenRouter(prompt, model, aspectRatio || '1:1', apiKey);
    }

    console.log('Image generated successfully, URL type:',
      imageUrl.startsWith('data:') ? 'base64' : 'http',
      'length:', imageUrl.length
    );

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error('=== Generate Image API Error ===');
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}
