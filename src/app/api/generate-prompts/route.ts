import { NextRequest, NextResponse } from 'next/server';
import { ProductInfo, AnalysisResult, ImageTypeId, ImagePrompt, isDashScopeModel, ALL_IMAGE_TYPES } from '@/types';
import { getBatchGenerationKnowledge } from '@/lib/designKnowledgeSelector';

// DashScope API 基础配置
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// App Router: 设置最大执行时间
export const maxDuration = 60;

interface EnabledTypeConfig {
  id: string;
  name: string;
  count: number;
  promptHint: string;
}

function buildSystemPrompt(enabledTypes: EnabledTypeConfig[], productCategory?: string): string {
  const typeInstructions = enabledTypes.map(t =>
    `- ${t.name} (${t.id}): ${t.count} prompts. Style hint: ${t.promptHint}`
  ).join('\n');

  // 收集所有启用类型对应的设计知识
  const knowledgeSections: string[] = [];
  const seenKnowledge = new Set<string>(); // 避免重复

  enabledTypes.forEach(t => {
    const knowledge = getBatchGenerationKnowledge(t.id as ImageTypeId, productCategory);
    if (knowledge && !seenKnowledge.has(knowledge)) {
      seenKnowledge.add(knowledge);
      knowledgeSections.push(`=== ${t.name.toUpperCase()} PHOTOGRAPHY KNOWLEDGE ===\n${knowledge}`);
    }
  });

  const designKnowledge = knowledgeSections.length > 0
    ? `\n\nDESIGN KNOWLEDGE BASE (Apply these rules to your prompts):\n${knowledgeSections.join('\n\n')}`
    : '';

  return `You are an expert Amazon product photographer and AI image prompt engineer.

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
${designKnowledge}

IMAGE TYPES TO GENERATE:
${typeInstructions}

For each type, follow the style hint AND the corresponding design knowledge rules above to create appropriate prompts.

CRITICAL OUTPUT FORMAT:
- You MUST respond with ONLY a valid JSON object
- NO markdown code fences (no \`\`\`json or \`\`\`)
- NO explanations or additional text before or after the JSON
- NO comments inside the JSON
- The JSON must have this exact structure with ALL requested types:
{
${enabledTypes.map(t => `  "${t.id}": ["prompt1", "prompt2", ...]`).join(',\n')}
}`;
}

/**
 * 清洗 AI 返回的 JSON 文本
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
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      cleaned = objMatch[0];
    } else {
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
  fixed = fixed.replace(/,(\s*[\]\}])/g, '$1');
  fixed = fixed.replace(/'/g, '"');
  return fixed;
}

/**
 * 解析 JSON，带自动修复重试
 */
function parseJsonWithRetry(text: string): unknown {
  const cleaned = cleanJsonResponse(text);

  try {
    return JSON.parse(cleaned);
  } catch {
    console.log('First JSON parse attempt failed, trying to fix...');

    try {
      const fixed = tryFixJson(cleaned);
      return JSON.parse(fixed);
    } catch {
      throw new Error(
        `JSON解析失败。原始内容前500字符: ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`
      );
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productInfo,
      analysisResult,
      enabledTypes,
      model,
      singleType,
      singleIndex,
      promptHint,
    } = body as {
      productInfo: ProductInfo;
      analysisResult: AnalysisResult;
      enabledTypes?: EnabledTypeConfig[];
      model?: string;
      singleType?: string;
      singleIndex?: number;
      promptHint?: string;
      apiKey?: string;
    };

    if (!productInfo || !analysisResult) {
      return NextResponse.json(
        { error: '缺少产品信息或分析结果' },
        { status: 400 }
      );
    }

    // 使用的模型（必须先定义，后面 isDashScope 依赖它）
    const selectedModel = model || 'qwen-plus';

    // API Keys
    const openRouterKey = process.env.OPENROUTER_API_KEY || body.apiKey;
    const dashScopeKey = process.env.DASHSCOPE_API_KEY;

    const isDashScope = isDashScopeModel(selectedModel);
    const apiKey = isDashScope ? dashScopeKey : openRouterKey;

    if (!apiKey) {
      return NextResponse.json(
        { error: isDashScope ? '请先配置 DASHSCOPE_API_KEY' : '请先配置 OpenRouter API Key' },
        { status: 400 }
      );
    }

    // 默认的 enabledTypes（向后兼容）
    const defaultEnabledTypes: EnabledTypeConfig[] = [
      { id: 'main', name: '主图', count: 6, promptHint: 'Amazon main product image, clean pure white background' },
      { id: 'sellingPoint', name: '卖点图', count: 7, promptHint: 'Amazon infographic style, highlight features' },
      { id: 'scene', name: '场景图', count: 7, promptHint: 'Lifestyle scene showing product in use' },
      { id: 'detail', name: '细节图', count: 2, promptHint: 'Close-up macro shot of product details' },
      { id: 'usage', name: '使用图', count: 2, promptHint: 'Step-by-step demonstration' },
      { id: 'handheld', name: '手持图', count: 2, promptHint: 'Product held by human hands for scale' },
    ];

    const typesToGenerate = enabledTypes || defaultEnabledTypes;

    // 调试日志：显示要生成的类型
    console.log('=== Types to generate ===');
    console.log(`Received ${enabledTypes?.length || 0} enabled types from request`);
    console.log(`Will generate prompts for ${typesToGenerate.length} types:`);
    typesToGenerate.forEach(t => console.log(`  - ${t.name} (${t.id}): ${t.count} prompts`));

    const systemPrompt = buildSystemPrompt(typesToGenerate, productInfo.category);

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

CRITICAL: For scene, usage, and handheld images, you MUST incorporate the actual product colors, textures, and proportions from the reference analysis above.`;
    }

    // 构建用户提示
    let userPrompt = `Generate AI image prompts for the following product:

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

Generate prompts for these types:
${typesToGenerate.map(t => `- ${t.name}: ${t.count} prompts`).join('\n')}

IMPORTANT: Return ONLY the JSON object. No markdown, no code fences, no explanation.`;

    // 如果是重新生成单个 prompt
    if (singleType !== undefined && singleIndex !== undefined) {
      // 从 ALL_IMAGE_TYPES 查找类型配置，支持所有类型（包括附加类型）
      const typeConfigFromAll = ALL_IMAGE_TYPES.find(t => t.id === singleType);
      if (!typeConfigFromAll) {
        return NextResponse.json(
          { error: '无效的图片类型' },
          { status: 400 }
        );
      }

      console.log(`=== Regenerating single prompt: ${typeConfigFromAll.name} #${singleIndex + 1} ===`);

      userPrompt = `Regenerate a SINGLE prompt for:
- Type: ${typeConfigFromAll.name} (${singleType})
- Index: ${singleIndex + 1}
- Style hint: ${promptHint || typeConfigFromAll.promptHint}

Product Name: ${productInfo.name}
Description: ${productInfo.description}
Style: ${analysisResult.style}
Color Palette: ${analysisResult.colorPalette}${referenceSection}

Return ONLY a JSON object with this exact structure:
{
  "${singleType}": ["the_single_prompt_here"]
}`;
    }

    console.log(`=== Generating prompts with model: ${selectedModel} (${isDashScope ? 'DashScope' : 'OpenRouter'}) ===`);

    const apiUrl = isDashScope
      ? `${DASHSCOPE_BASE_URL}/chat/completions`
      : 'https://openrouter.ai/api/v1/chat/completions';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };

    if (!isDashScope) {
      headers['HTTP-Referer'] = 'http://localhost:3000';
      headers['X-Title'] = 'Product Image AI';
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 10000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`${isDashScope ? 'DashScope' : 'OpenRouter'} API Error:`, errorData);
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

    console.log('=== Raw AI Response ===');
    console.log(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
    console.log('=== End Raw Response ===');

    try {
      const promptsData = parseJsonWithRetry(content) as Record<string, string[]>;

      // 转换为统一格式
      const prompts: ImagePrompt[] = [];

      // 如果是单条重新生成，只返回该单条
      if (singleType !== undefined && singleIndex !== undefined) {
        const typeConfigFromAll = ALL_IMAGE_TYPES.find(t => t.id === singleType);
        if (typeConfigFromAll) {
          const typePrompts = promptsData[singleType] || [];
          if (typePrompts.length > 0) {
            prompts.push({
              id: `prompt-${singleType}-${singleIndex}`,
              type: singleType as ImageTypeId,
              typeName: typeConfigFromAll.name,
              index: singleIndex + 1,
              prompt: typePrompts[0],
            });
          }
        }
        console.log(`=== Successfully regenerated 1 prompt for ${singleType} ===`);
        return NextResponse.json({ prompts });
      }

      // 全量生成：遍历所有启用的类型
      typesToGenerate.forEach(typeConfig => {
        const typePrompts = promptsData[typeConfig.id] || [];
        for (let i = 0; i < typeConfig.count; i++) {
          prompts.push({
            id: `prompt-${typeConfig.id}-${i}`,
            type: typeConfig.id as ImageTypeId,
            typeName: typeConfig.name,
            index: i + 1,
            prompt: typePrompts[i] || `[待生成] ${typeConfig.name} ${i + 1}`,
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
