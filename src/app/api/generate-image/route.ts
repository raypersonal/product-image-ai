import { NextRequest, NextResponse } from 'next/server';

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
      images?: ImageBlock[];  // 图片在 message.images 里
    };
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, model, aspectRatio } = body as {
      prompt: string;
      model: string;
      aspectRatio?: string;  // "1:1" / "4:3" / "3:4"
      apiKey?: string;
    };
    // 优先使用环境变量，其次使用前端传来的 apiKey
    const apiKey = process.env.OPENROUTER_API_KEY || body.apiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: '请先配置 OpenRouter API Key' },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: '缺少图片Prompt' },
        { status: 400 }
      );
    }

    // 构建请求体
    const requestBody: Record<string, unknown> = {
      model: model || 'black-forest-labs/flux.2-flex',
      messages: [
        { role: 'user', content: prompt }
      ],
      modalities: ['image'],  // FLUX 是纯图片模型
    };

    // 如果指定了宽高比，添加 image_config
    if (aspectRatio) {
      requestBody.image_config = {
        aspect_ratio: aspectRatio,  // "1:1" / "4:3" / "3:4"
      };
    }

    console.log('=== 发送请求 ===');
    console.log('Model:', requestBody.model);
    console.log('Aspect Ratio:', aspectRatio || 'default');

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
      console.error('=== OpenRouter API Error ===');
      console.error(JSON.stringify(errorData, null, 2));
      return NextResponse.json(
        { error: `图片生成失败：${errorData.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data: OpenRouterImageResponse = await response.json();

    // 调试日志：打印完整返回结构（截取前2000字符避免base64太长）
    const dataStr = JSON.stringify(data, null, 2);
    console.log('=== OpenRouter完整返回 ===');
    console.log(dataStr.length > 2000 ? dataStr.substring(0, 2000) + '...[truncated]' : dataStr);
    console.log('=== 返回结束 ===');

    let imageUrl: string | null = null;

    // 方法1: 从 choices[0].message.images 获取（正确的结构）
    const messageImages = data.choices?.[0]?.message?.images;
    if (messageImages && Array.isArray(messageImages) && messageImages.length > 0) {
      const imageBlock = messageImages.find(img => img.type === 'image_url');
      if (imageBlock && imageBlock.image_url?.url) {
        imageUrl = imageBlock.image_url.url;
        console.log('Found image in message.images');
      }
    }

    // 方法2: 兜底 - 从 content 数组里找（某些模型可能用这种格式）
    if (!imageUrl) {
      const content = data.choices?.[0]?.message?.content;
      if (Array.isArray(content)) {
        const imageBlock = (content as ImageBlock[]).find(block => block.type === 'image_url');
        if (imageBlock && imageBlock.image_url?.url) {
          imageUrl = imageBlock.image_url.url;
          console.log('Found image in message.content array');
        }
      } else if (typeof content === 'string') {
        // 检查是否是 data URL
        if (content.startsWith('data:image/')) {
          imageUrl = content;
          console.log('Found image as data URL string in content');
        }
        // 尝试从字符串中提取 URL
        const urlMatch = content.match(/https?:\/\/[^\s"<>]+\.(png|jpg|jpeg|webp)/i);
        if (urlMatch) {
          imageUrl = urlMatch[0];
          console.log('Found image URL in content string');
        }
      }
    }

    if (!imageUrl) {
      console.error('=== No image URL found ===');
      console.error('Full response:', JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: '未能获取生成的图片URL，请查看服务器日志' },
        { status: 500 }
      );
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
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}
