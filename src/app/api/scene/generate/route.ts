import { NextRequest, NextResponse } from 'next/server';
import { isDashScopeModel, convertAspectRatioToDashScope } from '@/types';
import { jimengText2Img } from '@/lib/jimengApi';

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
  negativePrompt: string,
  model: string,
  aspectRatio: string,
  apiKey: string
): Promise<string> {
  const size = convertAspectRatioToDashScope(aspectRatio);

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           DASHSCOPE IMAGE GENERATION                        ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║ Model: ${model}`);
  console.log(`║ Aspect Ratio: ${aspectRatio} → Size: ${size}`);
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║ PROMPT:');
  console.log('║ ' + prompt.split('\n').join('\n║ '));
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║ NEGATIVE PROMPT:');
  console.log('║ ' + negativePrompt);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // 构建请求体
  const requestBody: {
    model: string;
    input: { prompt: string; negative_prompt?: string };
    parameters: { size: string; n: number };
  } = {
    model,
    input: {
      prompt,
    },
    parameters: {
      size,
      n: 1,
    },
  };

  // DashScope 支持 negative_prompt
  if (negativePrompt) {
    requestBody.input.negative_prompt = negativePrompt;
  }

  // Step 1: 提交异步任务
  const createResponse = await fetch(DASHSCOPE_IMAGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify(requestBody),
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json().catch(() => ({}));
    console.error('❌ DashScope Create Task Error:', errorData);
    throw new Error(`百炼任务创建失败：${errorData.message || createResponse.statusText}`);
  }

  const createData: DashScopeTaskResponse = await createResponse.json();
  const taskId = createData.output?.task_id;

  if (!taskId) {
    throw new Error('百炼任务ID获取失败');
  }

  console.log(`>>> Task created: ${taskId}`);

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

    if (i % 5 === 0) {
      console.log(`>>> Task ${taskId} status: ${status} (attempt ${i + 1})`);
    }

    if (status === 'SUCCEEDED') {
      const results = statusData.output?.results;
      if (results && results.length > 0) {
        const imageUrl = results[0].url || results[0].b64_image;
        if (imageUrl) {
          console.log('✅ Image generated successfully!');
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
  negativePrompt: string,
  model: string,
  aspectRatio: string,
  apiKey: string
): Promise<string> {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           OPENROUTER IMAGE GENERATION                       ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║ Model: ${model}`);
  console.log(`║ Aspect Ratio: ${aspectRatio}`);
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║ PROMPT:');
  console.log('║ ' + prompt.split('\n').join('\n║ '));
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║ NEGATIVE PROMPT:');
  console.log('║ ' + negativePrompt);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

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

  // 将 negative prompt 附加到 prompt
  const fullPrompt = negativePrompt
    ? `${prompt}\n\nNegative: ${negativePrompt}`
    : prompt;

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
          content: fullPrompt,
        },
      ],
      provider: {
        sort: 'throughput',
      },
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
    console.log('✅ Image generated successfully!');
    return images[0].image_url?.url || images[0].url || images[0];
  }

  if (content && (content.startsWith('http') || content.startsWith('data:'))) {
    console.log('✅ Image generated successfully!');
    return content;
  }

  throw new Error('无法从 OpenRouter 响应中提取图片');
}

/**
 * 使用即梦AI生成图片
 */
async function generateWithJimeng(
  prompt: string,
  negativePrompt: string,
  model: string,
  aspectRatio: string,
  accessKey: string,
  secretKey: string
): Promise<string> {
  // 根据模型ID判断版本
  const modelVersion: '4.0' | '4.6' = model === 'jimeng-4.6' ? '4.6' : '4.0';

  // 即梦AI文生图
  const result = await jimengText2Img(accessKey, secretKey, {
    prompt,
    negativePrompt,
    aspectRatio,
    modelVersion,
  });

  return result.imageUrl;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      negativePrompt,
      model,
      aspectRatio,
      platform,
    } = body as {
      prompt: string;
      negativePrompt?: string;
      model: string;
      aspectRatio: string;
      platform: 'dashscope' | 'openrouter' | 'jimeng';
    };

    if (!prompt) {
      return NextResponse.json(
        { error: '请提供图片生成提示词' },
        { status: 400 }
      );
    }

    const selectedModel = model || 'wanx2.1-t2i-turbo';
    const selectedAspectRatio = aspectRatio || '1:1';
    // 根据模型判断平台（支持新增的即梦）
    let selectedPlatform = platform;
    if (!selectedPlatform) {
      if (selectedModel.startsWith('jimeng')) {
        selectedPlatform = 'jimeng';
      } else if (isDashScopeModel(selectedModel)) {
        selectedPlatform = 'dashscope';
      } else {
        selectedPlatform = 'openrouter';
      }
    }
    const selectedNegativePrompt = negativePrompt || '';

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           SCENE GENERATE API - REQUEST                      ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Platform: ${selectedPlatform}`);
    console.log(`║ Model: ${selectedModel}`);
    console.log(`║ Aspect Ratio: ${selectedAspectRatio}`);
    console.log(`║ Prompt Length: ${prompt.length} chars`);
    console.log(`║ Negative Prompt: ${selectedNegativePrompt ? 'Yes' : 'No'}`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    let imageUrl: string;

    if (selectedPlatform === 'jimeng') {
      // 即梦AI
      const accessKey = process.env.VOLC_ACCESS_KEY;
      const secretKey = process.env.VOLC_SECRET_KEY;
      if (!accessKey || !secretKey) {
        return NextResponse.json(
          { error: '请配置 VOLC_ACCESS_KEY 和 VOLC_SECRET_KEY' },
          { status: 400 }
        );
      }
      imageUrl = await generateWithJimeng(prompt, selectedNegativePrompt, selectedModel, selectedAspectRatio, accessKey, secretKey);
    } else if (selectedPlatform === 'dashscope') {
      const apiKey = process.env.DASHSCOPE_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: '请配置 DASHSCOPE_API_KEY' },
          { status: 400 }
        );
      }
      imageUrl = await generateWithDashScope(prompt, selectedNegativePrompt, selectedModel, selectedAspectRatio, apiKey);
    } else {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: '请配置 OPENROUTER_API_KEY' },
          { status: 400 }
        );
      }
      imageUrl = await generateWithOpenRouter(prompt, selectedNegativePrompt, selectedModel, selectedAspectRatio, apiKey);
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      model: selectedModel,
      aspectRatio: selectedAspectRatio,
      platform: selectedPlatform,
    });
  } catch (error) {
    console.error('\n❌ Scene Generate API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '图片生成失败' },
      { status: 500 }
    );
  }
}
