import { NextRequest, NextResponse } from 'next/server';
import { ProductInfo, AnalysisResult, IMAGE_TYPE_CONFIG, ImageType } from '@/types';

const SYSTEM_PROMPT = `You are an expert Amazon product photographer and AI image prompt engineer.

Your task is to generate detailed, high-quality prompts for AI image generation (Flux model) based on product information and analysis.

IMPORTANT RULES:
1. All prompts MUST be in English
2. Each prompt should be detailed (150-300 words)
3. Include specific details about:
   - Composition and framing
   - Lighting setup
   - Background and environment
   - Product positioning
   - Color scheme (based on the analysis)
   - Style and mood
   - Camera angle
   - Props and accessories (if applicable)
4. For Amazon product images, follow these guidelines:
   - Main images: Clean white background, product fills 85% of frame
   - Selling point images: Highlight specific features with call-outs or visual emphasis
   - Scene images: Lifestyle settings showing product in use
   - Detail images: Close-up macro shots of textures, materials, patterns
   - Usage images: Step-by-step or demonstration shots
   - Handheld images: Product held by model hands for scale reference

CRITICAL OUTPUT FORMAT:
- You MUST respond with ONLY a valid JSON object
- NO markdown code fences (no \`\`\`json or \`\`\`)
- NO explanations or additional text before or after the JSON
- NO comments inside the JSON
- The JSON must have this exact structure:
{
  "main": ["prompt1", "prompt2", ...],
  "sellingPoint": ["prompt1", "prompt2", ...],
  "scene": ["prompt1", "prompt2", ...],
  "detail": ["prompt1", "prompt2", ...],
  "usage": ["prompt1", "prompt2", ...],
  "handheld": ["prompt1", "prompt2", ...]
}`;

/**
 * 清洗 AI 返回的 JSON 文本
 * 处理各种常见问题：markdown代码块、多余文字、BOM头等
 */
function cleanJsonResponse(text: string): string {
  let cleaned = text;

  // 1. 去掉 BOM 头和不可见字符
  cleaned = cleaned.replace(/^\uFEFF/, '');
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 2. trim 首尾空白
  cleaned = cleaned.trim();

  // 3. 去掉 markdown 代码块标记（多种格式）
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
  cleaned = cleaned.replace(/\n?```\s*$/i, '');
  cleaned = cleaned.trim();

  // 4. 如果不是以 { 或 [ 开头，尝试提取 JSON
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
    // 尝试找对象
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      cleaned = objMatch[0];
    } else {
      // 尝试找数组
      const arrMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrMatch) {
        cleaned = arrMatch[0];
      }
    }
  }

  return cleaned.trim();
}

/**
 * 尝试修复常见的 JSON 格式问题
 */
function tryFixJson(text: string): string {
  let fixed = text;

  // 修复末尾多余逗号 (如 [1,2,3,] 或 {"a":1,})
  fixed = fixed.replace(/,(\s*[\]\}])/g, '$1');

  // 单引号替换为双引号（简单情况）
  // 注意：这个处理比较粗暴，可能会破坏包含单引号的字符串值
  // 只在第一次解析失败时尝试
  fixed = fixed.replace(/'/g, '"');

  return fixed;
}

/**
 * 解析 JSON，带自动修复重试
 */
function parseJsonWithRetry(text: string): unknown {
  const cleaned = cleanJsonResponse(text);

  // 第一次尝试
  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    console.log('First JSON parse attempt failed, trying to fix...');

    // 第二次尝试：修复常见问题
    try {
      const fixed = tryFixJson(cleaned);
      return JSON.parse(fixed);
    } catch (secondError) {
      // 两次都失败，抛出详细错误
      throw new Error(
        `JSON解析失败。原始内容前500字符: ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`
      );
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productInfo, analysisResult } = body as {
      productInfo: ProductInfo;
      analysisResult: AnalysisResult;
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

    if (!productInfo || !analysisResult) {
      return NextResponse.json(
        { error: '缺少产品信息或分析结果' },
        { status: 400 }
      );
    }

    // 构建参考图片分析部分
    let referenceSection = '';
    if (analysisResult.referenceAnalysis) {
      const ref = analysisResult.referenceAnalysis;
      referenceSection = `

Reference Images Analysis (IMPORTANT - Use these details for accurate product representation):
- Product Appearance: ${ref.appearance}
- Packaging Features: ${ref.packaging}
- Competitive Differentiation: ${ref.competitorDiff}
- Design Elements to Incorporate: ${ref.designElements}

CRITICAL: For scene, usage, and handheld images, you MUST incorporate the actual product colors, textures, and proportions from the reference analysis above. The generated images should accurately represent the real product.`;
    }

    const userPrompt = `Generate AI image prompts for the following product:

Product Name: ${productInfo.name}
Category: ${productInfo.category}
Description: ${productInfo.description}
Selling Points: ${productInfo.sellingPoints.filter(s => s).join(', ')}
Target Audience: ${productInfo.targetAudience}
Style Preferences: ${productInfo.stylePreferences.join(', ')}

AI Analysis Results:
- Visual Style: ${analysisResult.style}
- Color Palette: ${analysisResult.colorPalette}
- Target Audience: ${analysisResult.targetAudience}
- Key Selling Points: ${analysisResult.sellingPoints.join(', ')}
- Suggested Scenes: ${analysisResult.scenes.join(', ')}${referenceSection}

Generate prompts for:
- Main Images: ${IMAGE_TYPE_CONFIG.main.count} prompts
- Selling Point Images: ${IMAGE_TYPE_CONFIG.sellingPoint.count} prompts
- Scene Images: ${IMAGE_TYPE_CONFIG.scene.count} prompts
- Detail Images: ${IMAGE_TYPE_CONFIG.detail.count} prompts
- Usage Images: ${IMAGE_TYPE_CONFIG.usage.count} prompts
- Handheld Images: ${IMAGE_TYPE_CONFIG.handheld.count} prompts

IMPORTANT: Return ONLY the JSON object. No markdown, no code fences, no explanation.`;

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
        max_tokens: 8000,
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

    // 打印原始内容便于调试
    console.log('=== Raw AI Response ===');
    console.log(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
    console.log('=== End Raw Response ===');

    try {
      const promptsData = parseJsonWithRetry(content) as Record<string, string[]>;

      // 转换为统一格式
      const prompts: Array<{
        id: string;
        type: ImageType;
        typeName: string;
        index: number;
        prompt: string;
      }> = [];

      (Object.entries(IMAGE_TYPE_CONFIG) as [ImageType, { name: string; count: number }][]).forEach(([type, config]) => {
        const typePrompts = promptsData[type] || [];
        for (let i = 0; i < config.count; i++) {
          prompts.push({
            id: `prompt-${type}-${i}`,
            type,
            typeName: config.name,
            index: i + 1,
            prompt: typePrompts[i] || `[待生成] ${config.name} ${i + 1}`,
          });
        }
      });

      console.log(`=== Successfully parsed ${prompts.length} prompts ===`);
      return NextResponse.json({ prompts });
    } catch (parseError) {
      console.error('=== JSON Parse Error ===');
      console.error('Error:', parseError);
      console.error('=== End Error Log ===');

      const errorMessage = parseError instanceof Error ? parseError.message : '未知解析错误';
      return NextResponse.json(
        { error: `无法解析AI返回的Prompt: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Generate Prompts API Error:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}
