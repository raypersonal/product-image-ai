import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;

// wan2.6-image 多模态生成接口
const DASHSCOPE_MULTIMODAL_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

interface Wan26Response {
  request_id?: string;
  output?: {
    task_id?: string;
    task_status?: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
    message?: string;
    code?: string;
    choices?: Array<{
      message?: {
        content?: Array<{
          image?: string;
          text?: string;
        }>;
      };
    }>;
  };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    image_count?: number;
  };
}

/**
 * 确保图片是正确的 data URI 格式
 */
function ensureDataUri(base64: string): string {
  // 如果已经是 data URI 格式，直接返回
  if (base64.startsWith('data:image/')) {
    return base64;
  }
  // 否则添加 JPEG 前缀（因为我们的压缩器输出 JPEG）
  return `data:image/jpeg;base64,${base64}`;
}

/**
 * 使用 wan2.6-image 进行图生图
 * 保持产品主体，替换背景/场景
 */
async function generateWithWan26(
  productImageBase64: string,
  scenePrompt: string,
  negativePrompt: string,
  size: string,
  apiKey: string
): Promise<string> {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           WAN2.6-IMAGE 图生图                               ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log('║ Scene Prompt:');
  console.log('║ ' + scenePrompt.substring(0, 200) + (scenePrompt.length > 200 ? '...' : ''));
  console.log('║ Size:', size);
  console.log('║ Negative Prompt:', negativePrompt.substring(0, 100));
  console.log('║ Image Format:', productImageBase64.substring(0, 50) + '...');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // 确保图片是正确的 data URI 格式
  const imageDataUri = ensureDataUri(productImageBase64);
  console.log('>>> Image Data URI prefix:', imageDataUri.substring(0, 30));

  // 构建请求体 - 使用 wan2.6-image 模型
  const requestBody = {
    model: 'wan2.6-image',
    input: {
      messages: [
        {
          role: 'user',
          content: [
            {
              text: `保持图片中产品的外观、形状、颜色、材质完全不变。只替换背景和环境。

${scenePrompt}

重要要求：
- 产品主体必须与原图完全一致，不能有任何变形、拉伸或修改
- 只改变背景、灯光和摆放角度
- 保持产品的精确比例和颜色`,
            },
            {
              image: imageDataUri,
            },
          ],
        },
      ],
    },
    parameters: {
      size: size || '1024*1024',
      n: 1,
      enable_interleave: false,  // 图片编辑模式
    },
  };

  console.log('>>> Calling wan2.6-image API...');

  const response = await fetch(DASHSCOPE_MULTIMODAL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ wan2.6-image API Error:', errorData);
    throw new Error(`wan2.6-image 调用失败：${errorData.message || JSON.stringify(errorData) || response.statusText}`);
  }

  const data: Wan26Response = await response.json();

  console.log('>>> wan2.6-image Response:', JSON.stringify(data, null, 2));

  // 检查是否成功
  if (data.output?.task_status === 'FAILED') {
    throw new Error(`wan2.6-image 生成失败：${data.output?.message || '未知错误'}`);
  }

  // 提取图片
  const choices = data.output?.choices;
  if (choices && choices.length > 0) {
    const content = choices[0].message?.content;
    if (content) {
      for (const item of content) {
        if (item.image) {
          console.log('✅ wan2.6-image 生成成功！');
          return item.image;
        }
      }
    }
  }

  throw new Error('wan2.6-image 返回结果中没有图片');
}

/**
 * 备选：使用 wanx2.1-imageedit 进行图生图
 */
async function generateWithImageEdit(
  productImageBase64: string,
  scenePrompt: string,
  negativePrompt: string,
  apiKey: string
): Promise<string> {
  const I2I_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis';

  console.log('\n>>> Trying wanx2.1-imageedit as fallback...');

  // 确保图片是正确的 data URI 格式
  const imageDataUri = ensureDataUri(productImageBase64);

  const requestBody = {
    model: 'wanx2.1-imageedit',
    input: {
      function: 'description_edit',  // 文本驱动编辑，无需遮罩
      prompt: `保持产品主体完全不变，只替换背景。${scenePrompt}`,
      base_image_url: imageDataUri,
    },
    parameters: {
      n: 1,
    },
  };

  const response = await fetch(I2I_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`wan2.5-i2i 调用失败：${errorData.message || response.statusText}`);
  }

  const createData = await response.json();
  const taskId = createData.output?.task_id;

  if (!taskId) {
    throw new Error('wan2.5-i2i 任务ID获取失败');
  }

  console.log(`>>> Task created: ${taskId}`);

  // 轮询任务状态
  const TASK_URL = 'https://dashscope.aliyuncs.com/api/v1/tasks';
  const maxAttempts = 60;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const statusResponse = await fetch(`${TASK_URL}/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!statusResponse.ok) continue;

    const statusData = await statusResponse.json();
    const status = statusData.output?.task_status;

    if (i % 5 === 0) {
      console.log(`>>> Task ${taskId} status: ${status} (attempt ${i + 1})`);
    }

    if (status === 'SUCCEEDED') {
      const results = statusData.output?.results;
      if (results && results.length > 0) {
        const imageUrl = results[0].url || results[0].b64_image;
        if (imageUrl) {
          console.log('✅ wanx2.1-imageedit 生成成功！');
          return imageUrl;
        }
      }
      throw new Error('图生图成功但无法获取结果');
    }

    if (status === 'FAILED') {
      throw new Error(`图生图失败：${statusData.output?.message || '未知错误'}`);
    }
  }

  throw new Error('图生图超时');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productImageBase64,
      scenePrompt,
      negativePrompt,
      size,
      productName,
    } = body as {
      productImageBase64: string;
      scenePrompt: string;
      negativePrompt?: string;
      size?: string;
      productName?: string;
    };

    if (!productImageBase64) {
      return NextResponse.json(
        { error: '请提供产品图片' },
        { status: 400 }
      );
    }

    if (!scenePrompt) {
      return NextResponse.json(
        { error: '请提供场景描述' },
        { status: 400 }
      );
    }

    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: '请配置 DASHSCOPE_API_KEY' },
        { status: 400 }
      );
    }

    // 构建完整的场景提示词
    const fullPrompt = productName
      ? `产品名称：${productName}。${scenePrompt}`
      : scenePrompt;

    const defaultNegative = '变形产品, 拉伸产品, 比例错误, 不同产品, 扭曲形状, 修改设计, 压扁, 拉长, 颜色错误, 材质错误, 模糊, 低质量';
    const finalNegativePrompt = negativePrompt || defaultNegative;

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           SCENE IMG2IMG API - REQUEST                       ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Product Name: ${productName || '(empty)'}`);
    console.log(`║ Scene Prompt Length: ${fullPrompt.length} chars`);
    console.log(`║ Size: ${size || '1024*1024'}`);
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    let imageUrl: string;

    try {
      // 先尝试 wan2.6-image
      imageUrl = await generateWithWan26(
        productImageBase64,
        fullPrompt,
        finalNegativePrompt,
        size || '1024*1024',
        apiKey
      );
    } catch (error) {
      console.error('wan2.6-image failed, trying wanx2.1-imageedit fallback...');
      console.error('Error:', error);

      // Fallback 到 wanx2.1-imageedit
      try {
        imageUrl = await generateWithImageEdit(
          productImageBase64,
          fullPrompt,
          finalNegativePrompt,
          apiKey
        );
      } catch (fallbackError) {
        console.error('wanx2.1-imageedit also failed:', fallbackError);
        throw new Error(`图生图失败：${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      model: 'wan2.6-image',
    });
  } catch (error) {
    console.error('\n❌ Scene Img2Img API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '图生图失败' },
      { status: 500 }
    );
  }
}
