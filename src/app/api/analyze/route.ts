import { NextRequest, NextResponse } from 'next/server';
import { ProductInfo, ReferenceImage, isDashScopeModel } from '@/types';

// App Router: 设置最大执行时间（Vercel 部署时生效）
export const maxDuration = 60;

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

const SYSTEM_PROMPT_WITH_REFS = `你是一位专业的亚马逊产品图片策划专家，特别擅长派对用品类目。

你的任务是分析用户提供的产品信息和参考图片分析结果，给出专业的图片拍摄/生成建议。

请根据产品信息和参考图片分析，输出以下内容（用JSON格式）：
{
  "style": "整体视觉风格建议（如：温馨浪漫、活泼欢快、简约现代等）",
  "colorPalette": "主色调和配色方案建议",
  "targetAudience": "目标人群画像描述",
  "sellingPoints": ["核心卖点1", "核心卖点2", "核心卖点3"],
  "scenes": ["建议场景1", "建议场景2", "建议场景3", "建议场景4", "建议场景5"],
  "referenceAnalysis": {
    "appearance": "产品外观描述（颜色、形状、材质、尺寸比例等）",
    "packaging": "包装特征描述",
    "competitorDiff": "与竞品的差异点和优势",
    "designElements": "可借鉴的设计元素和构图方式"
  }
}

注意：
1. 风格要与产品类别和目标人群匹配
2. 色彩建议要具体，基于参考图片的实际颜色
3. 场景建议要丰富，适合电商展示
4. 参考图片分析要详细，帮助后续Prompt生成更精准的图片
5. 所有建议都要考虑亚马逊平台的图片规范`;

const VISION_PROMPT = `请仔细分析这些产品参考图片，提取以下信息：

1. 产品外观特征：
   - 主体颜色和辅助色
   - 形状和轮廓
   - 材质和质感（光泽、纹理等）
   - 大致尺寸比例

2. 包装信息（如果可见）：
   - 包装类型和颜色
   - 标签和印刷内容

3. 拍摄和构图特点：
   - 拍摄角度
   - 光线和阴影
   - 背景和道具
   - 构图方式

4. 设计风格：
   - 整体风格（简约/华丽/可爱等）
   - 目标受众推测
   - 情感调性

请用中文详细描述，这些信息将用于生成更精准的AI产品图片。`;

// DashScope API 基础配置
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

/**
 * 调用 OpenRouter API
 */
async function callOpenRouter(
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
  model: string,
  apiKey: string,
  maxTokens = 3000
) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Product Image AI',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('OpenRouter API Error:', errorData);
    throw new Error(`API调用失败：${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

/**
 * 调用 DashScope API（OpenAI 兼容模式）
 */
async function callDashScope(
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
  model: string,
  apiKey: string,
  maxTokens = 3000
) {
  const response = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('DashScope API Error:', errorData);
    throw new Error(`百炼API调用失败：${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

/**
 * 使用 Vision 模型分析参考图片
 */
async function analyzeReferenceImages(
  images: ReferenceImage[],
  visionModel: string,
  openRouterKey: string,
  dashScopeKey: string
): Promise<string> {
  if (images.length === 0) return '';

  const isDashScope = isDashScopeModel(visionModel);
  const apiKey = isDashScope ? dashScopeKey : openRouterKey;

  if (!apiKey) {
    console.warn(`Missing API key for ${isDashScope ? 'DashScope' : 'OpenRouter'}, skipping vision analysis`);
    return '';
  }

  // 构建带图片的消息内容
  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text: VISION_PROMPT },
  ];

  // 添加每张图片及其描述
  for (const img of images) {
    if (img.description) {
      content.push({ type: 'text', text: `\n【图片说明：${img.description}】` });
    }
    content.push({
      type: 'image_url',
      image_url: { url: img.base64 },
    });
  }

  try {
    console.log(`=== Vision analysis using ${visionModel} (${isDashScope ? 'DashScope' : 'OpenRouter'}) ===`);

    const result = isDashScope
      ? await callDashScope([{ role: 'user', content }], visionModel, apiKey)
      : await callOpenRouter([{ role: 'user', content }], visionModel, apiKey);

    if (!result) {
      throw new Error('Vision分析返回为空');
    }

    console.log('=== Vision Analysis Result ===');
    console.log(result.substring(0, 500) + '...');
    return result;
  } catch (error) {
    console.error('Vision analysis error:', error);
    // 不抛出错误，返回空字符串让流程继续
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productInfo: ProductInfo = body.productInfo;
    const referenceImages: ReferenceImage[] = body.referenceImages || [];
    const analyzeModel: string = body.analyzeModel || 'qwen-plus';
    const visionModel: string = body.visionModel || 'qwen-vl-plus';

    // API Keys
    const openRouterKey = process.env.OPENROUTER_API_KEY || body.apiKey;
    const dashScopeKey = process.env.DASHSCOPE_API_KEY;

    const isDashScope = isDashScopeModel(analyzeModel);
    const apiKey = isDashScope ? dashScopeKey : openRouterKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: isDashScope ? '请先配置 DASHSCOPE_API_KEY' : '请先配置 OpenRouter API Key' },
        { status: 400 }
      );
    }

    if (!productInfo || !productInfo.name) {
      return NextResponse.json(
        { error: '请提供完整的产品信息' },
        { status: 400 }
      );
    }

    // 如果有参考图片，先用 Vision 模型分析
    let visionAnalysis = '';
    if (referenceImages.length > 0) {
      console.log(`=== Analyzing ${referenceImages.length} reference images ===`);
      visionAnalysis = await analyzeReferenceImages(
        referenceImages,
        visionModel,
        openRouterKey || '',
        dashScopeKey || ''
      );
    }

    // 构建用户提示
    let userPrompt = `请分析以下产品并给出图片策划建议：

产品名称：${productInfo.name}
产品类别：${productInfo.category}
产品描述：${productInfo.description}
核心卖点：${productInfo.sellingPoints.filter(s => s).join('、')}
目标人群：${productInfo.targetAudience}
风格偏好：${productInfo.stylePreferences.join('、')}`;

    // 如果有参考图片分析结果，添加到提示中
    if (visionAnalysis) {
      userPrompt += `

---
【参考图片分析结果】
用户上传了 ${referenceImages.length} 张参考图片，以下是 AI 对这些图片的分析：

${visionAnalysis}

请基于以上产品信息和参考图片分析，给出更精准的图片策划建议。`;
    }

    userPrompt += '\n\n请返回JSON格式的分析结果。';

    console.log(`=== Product analysis using ${analyzeModel} (${isDashScope ? 'DashScope' : 'OpenRouter'}) ===`);

    const messages = [
      { role: 'system', content: visionAnalysis ? SYSTEM_PROMPT_WITH_REFS : SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ];

    const content = isDashScope
      ? await callDashScope(messages, analyzeModel, apiKey)
      : await callOpenRouter(messages, analyzeModel, apiKey);

    if (!content) {
      return NextResponse.json(
        { error: 'AI返回内容为空' },
        { status: 500 }
      );
    }

    // 尝试解析JSON
    try {
      // 移除可能的markdown代码块标记
      let jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();

      // 尝试提取 JSON 对象
      if (!jsonStr.startsWith('{')) {
        const match = jsonStr.match(/\{[\s\S]*\}/);
        if (match) {
          jsonStr = match[0];
        }
      }

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
