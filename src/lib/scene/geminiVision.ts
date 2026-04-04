/**
 * Gemini Vision 图+文分析
 * 通过 OpenRouter 调用 Gemini 模型分析产品图片
 */

export interface GeminiAnalysisInput {
  // 产品图片 base64
  productImageBase64: string;
  // 产品信息
  productName: string;
  productCategory: string;
  productDescription: string;
  // 场景标签
  sceneTags: string[];
  styleTags: string[];
  // 参考图权重 0-100
  referenceWeight: number;
}

export interface GeminiAnalysisOutput {
  prompt: string;
  productAnalysis: {
    appearance: string;
    colors: string;
    material: string;
    shape: string;
  };
  model: string;
  timestamp: number;
}

/**
 * 构建 Gemini 分析的 System Prompt
 */
export function buildGeminiSystemPrompt(): string {
  return `You are an expert product photographer and AI image prompt engineer.

Your task is to analyze a product image and create a detailed prompt for AI image generation that:
1. Preserves the exact appearance of the product (shape, color, texture, material, proportions)
2. Places the product naturally in the specified scene
3. Uses professional photography techniques

When analyzing the product, pay close attention to:
- Exact colors and color gradients
- Material and texture (matte, glossy, metallic, fabric, etc.)
- Shape and proportions
- Any text, logos, or distinctive features
- Size relative to common objects

Output your response in JSON format with:
{
  "productAnalysis": {
    "appearance": "Brief description of overall look",
    "colors": "Specific colors observed",
    "material": "Material and texture",
    "shape": "Shape and proportions"
  },
  "prompt": "A detailed 150-200 word prompt for image generation"
}`;
}

/**
 * 构建用户提示
 */
export function buildGeminiUserPrompt(input: GeminiAnalysisInput): string {
  const { productName, productCategory, productDescription, sceneTags, styleTags, referenceWeight } = input;

  const sceneDescription = sceneTags.length > 0 ? sceneTags.join(', ') : 'elegant setting';
  const styleDescription = styleTags.length > 0 ? styleTags.join(', ') : 'professional';
  const preserveLevel = referenceWeight > 70 ? 'strict' : referenceWeight > 40 ? 'moderate' : 'creative';

  return `Analyze this product image and create an AI image generation prompt.

Product Information:
- Name: ${productName || 'Product'}
- Category: ${productCategory || 'General'}
- Description: ${productDescription || 'A product'}

Target Scene: ${sceneDescription}
Style: ${styleDescription}
Product Preservation Level: ${preserveLevel} (${referenceWeight}%)

Instructions:
1. First, carefully analyze the product's visual characteristics
2. Then create a prompt that places this exact product in the target scene
3. ${preserveLevel === 'strict' ? 'The product must look exactly as shown - preserve all details' : preserveLevel === 'moderate' ? 'Keep the product recognizable while adapting to the scene' : 'Focus on the scene atmosphere while keeping product identity'}
4. Include professional lighting and composition suitable for e-commerce

Respond with valid JSON only.`;
}

/**
 * 调用 Gemini Vision API（通过 OpenRouter）
 */
export async function analyzeWithGemini(
  input: GeminiAnalysisInput,
  apiKey: string
): Promise<GeminiAnalysisOutput> {
  const systemPrompt = buildGeminiSystemPrompt();
  const userPrompt = buildGeminiUserPrompt(input);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Product Image AI - Scene Workbench',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: {
                url: input.productImageBase64,
              },
            },
          ],
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Gemini returned empty response');
  }

  // 解析 JSON 响应
  try {
    // 清理可能的 markdown 代码块
    const cleanContent = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(cleanContent);

    return {
      prompt: parsed.prompt || '',
      productAnalysis: parsed.productAnalysis || {
        appearance: '',
        colors: '',
        material: '',
        shape: '',
      },
      model: 'gemini-2.0-flash-exp',
      timestamp: Date.now(),
    };
  } catch {
    // 如果 JSON 解析失败，尝试提取 prompt 部分
    console.warn('Failed to parse Gemini response as JSON, using raw content');
    return {
      prompt: content,
      productAnalysis: {
        appearance: 'Analysis not available',
        colors: 'Unknown',
        material: 'Unknown',
        shape: 'Unknown',
      },
      model: 'gemini-2.0-flash-exp',
      timestamp: Date.now(),
    };
  }
}

/**
 * Mock Gemini 分析（测试用）
 */
export async function analyzeWithGeminiMock(
  input: GeminiAnalysisInput
): Promise<GeminiAnalysisOutput> {
  // 模拟 API 延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));

  const sceneDescription = input.sceneTags.join(', ') || 'elegant setting';

  return {
    prompt: `A ${input.productCategory || 'product'} "${input.productName || 'item'}" photographed in a ${sceneDescription} scene. The product features ${input.productDescription || 'high-quality materials'}. Professional product photography with soft natural lighting, shallow depth of field, and clean composition. The product is the clear focal point, placed on a complementary surface that enhances its appeal. 8K resolution, commercial quality suitable for e-commerce listing.`,
    productAnalysis: {
      appearance: 'Colorful and vibrant product with appealing design',
      colors: 'Multiple bright colors with good contrast',
      material: 'High-quality materials with smooth finish',
      shape: 'Compact and well-proportioned design',
    },
    model: 'mock',
    timestamp: Date.now(),
  };
}
