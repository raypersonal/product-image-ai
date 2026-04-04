import { NextRequest, NextResponse } from 'next/server';
import { ProductInfo } from '@/types';

const SYSTEM_PROMPT = `你是一位专业的亚马逊产品图片策划专家，特别擅长派对用品类目。

你的任务是分析用户提供的产品信息，并给出专业的图片拍摄/生成建议。

请根据产品信息，输出以下内容（用JSON格式）：
{
  "style": "整体视觉风格建议（如：温馨浪漫、活泼欢快、简约现代等）",
  "colorPalette": "主色调和配色方案建议",
  "targetAudience": "目标人群画像描述",
  "sellingPoints": ["核心卖点1", "核心卖点2", "核心卖点3"],
  "scenes": ["建议场景1", "建议场景2", "建议场景3", "建议场景4", "建议场景5"]
}

注意：
1. 风格要与产品类别和目标人群匹配
2. 色彩建议要具体，可用于AI图片生成
3. 场景建议要丰富，适合电商展示
4. 所有建议都要考虑亚马逊平台的图片规范`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productInfo: ProductInfo = body.productInfo;
    // 优先使用环境变量，其次使用前端传来的 apiKey
    const apiKey = process.env.OPENROUTER_API_KEY || body.apiKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: '请先配置 OpenRouter API Key' },
        { status: 400 }
      );
    }

    if (!productInfo || !productInfo.name) {
      return NextResponse.json(
        { error: '请提供完整的产品信息' },
        { status: 400 }
      );
    }

    const userPrompt = `请分析以下产品并给出图片策划建议：

产品名称：${productInfo.name}
产品类别：${productInfo.category}
产品描述：${productInfo.description}
核心卖点：${productInfo.sellingPoints.filter(s => s).join('、')}
目标人群：${productInfo.targetAudience}
风格偏好：${productInfo.stylePreferences.join('、')}

请返回JSON格式的分析结果。`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Product Image AI',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter API Error:', errorData);
      return NextResponse.json(
        { error: `API调用失败：${errorData.error?.message || response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'AI返回内容为空' },
        { status: 500 }
      );
    }

    // 尝试解析JSON
    try {
      // 移除可能的markdown代码块标记
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
      const result = JSON.parse(jsonStr);
      return NextResponse.json({ result });
    } catch {
      console.error('Failed to parse AI response:', content);
      return NextResponse.json(
        { error: '无法解析AI返回的结果，请重试' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Analyze API Error:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}
