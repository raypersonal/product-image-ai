/**
 * Gemini Vision 图+文分析
 * 通过 OpenRouter 调用 Gemini 模型分析产品图片
 */

// Gemini 模型配置（按优先级排序）
const GEMINI_MODELS = [
  'google/gemini-2.5-flash',        // 优先：便宜快速
  'google/gemini-2.0-flash-001',    // 备选
];

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
  // 产品外观锁定描述（极其详细）
  productLockDescription: string;
  // 完整的图片生成 Prompt
  prompt: string;
  // Negative Prompt
  negativePrompt: string;
  // 产品分析详情
  productAnalysis: {
    appearance: string;
    colors: string;
    material: string;
    shape: string;
    structure: string;
    proportions: string;
  };
  model: string;
  timestamp: number;
}

/**
 * 构建 Gemini 分析的 System Prompt - 要求极其详细的产品描述
 */
export function buildGeminiSystemPrompt(): string {
  return `You are an expert product analyst specializing in precise visual description for AI image generation.

Your CRITICAL task is to create an EXTREMELY DETAILED "Product Lock Description" that will prevent AI from modifying, distorting, or redesigning the product.

When analyzing the product, you MUST describe with extreme precision:

1. SHAPE & STRUCTURE:
   - Exact geometric shape (cylindrical, conical, rectangular, organic, etc.)
   - Number of layers/tiers/levels if applicable
   - How parts connect or stack
   - Any curves, angles, or edges

2. PROPORTIONS & DIMENSIONS:
   - Height-to-width ratio (e.g., "2:1 tall", "wider than tall")
   - Relative sizes of different parts
   - Thickness of elements

3. COLORS & PATTERNS:
   - Exact colors using descriptive terms (sage green, coral pink, etc.)
   - Color placement (which part is which color)
   - Any gradients, patterns, or color transitions

4. MATERIAL & TEXTURE:
   - Surface finish (matte, glossy, textured, smooth)
   - Material appearance (ceramic, plastic, metal, fabric)
   - Any visible texture patterns

5. DISTINCTIVE FEATURES:
   - Unique design elements
   - Decorative details
   - Any text, logos, or markings

Output ONLY valid JSON with this structure:
{
  "productLockDescription": "A single detailed paragraph (100-150 words) describing the product with extreme precision. This will be used as-is to lock the product appearance.",
  "productAnalysis": {
    "appearance": "Overall look summary",
    "colors": "All colors with their locations",
    "material": "Material and texture",
    "shape": "Geometric shape description",
    "structure": "Layers, tiers, parts structure",
    "proportions": "Size ratios and dimensions"
  }
}`;
}

/**
 * 构建用户提示
 */
export function buildGeminiUserPrompt(input: GeminiAnalysisInput): string {
  const { productName, productCategory, productDescription } = input;

  return `Analyze this product image with EXTREME PRECISION.

Product Information:
- Name: ${productName || 'Product'}
- Category: ${productCategory || 'General'}
- Description: ${productDescription || 'A product'}

YOUR TASK:
Create a "Product Lock Description" - an extremely detailed paragraph that describes this EXACT product so precisely that an AI image generator cannot modify, stretch, distort, or redesign it.

Focus on:
- Exact shape and structure (how many tiers/layers? what geometric shapes?)
- Precise colors and where they appear
- Material and texture
- Proportions (height vs width ratio)
- Any unique features

The description must be so specific that the product cannot be confused with anything else.

Respond with valid JSON only. No markdown, no explanations.`;
}

/**
 * 调用单个 Gemini 模型
 */
async function callGeminiModel(
  model: string,
  input: GeminiAnalysisInput,
  apiKey: string
): Promise<{ content: string; model: string }> {
  const systemPrompt = buildGeminiSystemPrompt();
  const userPrompt = buildGeminiUserPrompt(input);

  console.log(`>>> Trying Gemini model: ${model}`);

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
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`${model} failed: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(`${model} returned empty response`);
  }

  return { content, model };
}

/**
 * 调用 Gemini Vision API（带 fallback）
 */
export async function analyzeWithGemini(
  input: GeminiAnalysisInput,
  apiKey: string
): Promise<GeminiAnalysisOutput> {
  console.log('\n========== GEMINI VISION ANALYSIS ==========');
  console.log('Product Name:', input.productName || '(empty)');
  console.log('Scene Tags:', input.sceneTags.join(', ') || '(none)');
  console.log('Style Tags:', input.styleTags.join(', ') || '(none)');

  let content: string = '';
  let usedModel: string = '';
  let lastError: Error | null = null;

  // 依次尝试每个模型
  for (const model of GEMINI_MODELS) {
    try {
      const result = await callGeminiModel(model, input, apiKey);
      content = result.content;
      usedModel = result.model;
      console.log(`✅ Success with model: ${model}`);
      break;
    } catch (error) {
      console.error(`❌ Failed with ${model}:`, error instanceof Error ? error.message : error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  // 如果所有模型都失败，使用 fallback
  if (!content) {
    console.warn('\n⚠️ All Gemini models failed, using fallback prompt...');
    return buildFallbackOutput(input, lastError?.message || 'All models failed');
  }

  console.log('\n---------- GEMINI RAW RESPONSE ----------');
  console.log(content);
  console.log('---------- END GEMINI RESPONSE ----------\n');

  // 解析 JSON 响应
  try {
    const cleanContent = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(cleanContent);

    const productLockDescription = parsed.productLockDescription || '';
    const sceneDescription = input.sceneTags.length > 0 ? input.sceneTags.join(', ') : 'elegant studio setting';

    const finalPrompt = buildFinalPrompt(
      input.productName,
      productLockDescription,
      sceneDescription,
      input.styleTags
    );

    const negativePrompt = 'deformed product, stretched product, wrong proportions, different product, distorted shape, modified design, warped, squished, elongated, redesigned product, incorrect colors, wrong material';

    console.log('\n========== FINAL PROMPT FOR IMAGE MODEL ==========');
    console.log(finalPrompt);
    console.log('\n---------- NEGATIVE PROMPT ----------');
    console.log(negativePrompt);
    console.log('============================================\n');

    return {
      productLockDescription,
      prompt: finalPrompt,
      negativePrompt,
      productAnalysis: parsed.productAnalysis || {
        appearance: '',
        colors: '',
        material: '',
        shape: '',
        structure: '',
        proportions: '',
      },
      model: usedModel,
      timestamp: Date.now(),
    };
  } catch {
    console.warn('Failed to parse Gemini response as JSON, using fallback...');
    return buildFallbackOutput(input, 'JSON parse failed');
  }
}

/**
 * 构建 Fallback 输出（当 Gemini 失败时）
 * 关键：必须使用产品名称！
 */
function buildFallbackOutput(
  input: GeminiAnalysisInput,
  errorReason: string
): GeminiAnalysisOutput {
  const { productName, productCategory, productDescription, sceneTags, styleTags } = input;

  // 构建产品描述部分 - 必须使用产品名称！
  const productNamePart = productName
    ? `"${productName}"`
    : productCategory
    ? `A ${productCategory} product`
    : 'A product';

  const productDescPart = productDescription
    ? `. ${productDescription}`
    : '';

  // Fallback 的产品锁定描述
  const fallbackProductLock = `${productNamePart}${productDescPart}. A high-quality product with precise proportions and professional finish. Maintain exact shape, colors, and proportions as shown.`;

  const sceneDescription = sceneTags.length > 0 ? sceneTags.join(', ') : 'elegant studio setting';

  const finalPrompt = buildFinalPrompt(
    productName,
    fallbackProductLock,
    sceneDescription,
    styleTags
  );

  const negativePrompt = 'deformed product, stretched product, wrong proportions, different product, distorted shape, modified design, warped, squished, elongated, redesigned product, incorrect colors, wrong material';

  console.log('\n========== FALLBACK PROMPT (Gemini failed) ==========');
  console.log(`Reason: ${errorReason}`);
  console.log('\n--- FINAL PROMPT ---');
  console.log(finalPrompt);
  console.log('\n--- NEGATIVE PROMPT ---');
  console.log(negativePrompt);
  console.log('============================================\n');

  return {
    productLockDescription: fallbackProductLock,
    prompt: finalPrompt,
    negativePrompt,
    productAnalysis: {
      appearance: 'Fallback - Gemini analysis not available',
      colors: 'Unknown',
      material: 'Unknown',
      shape: 'Unknown',
      structure: 'Unknown',
      proportions: 'Unknown',
    },
    model: `fallback (${errorReason})`,
    timestamp: Date.now(),
  };
}

/**
 * 构建最终发送给图片模型的 Prompt
 */
export function buildFinalPrompt(
  productName: string,
  productLockDescription: string,
  sceneDescription: string,
  styleTags: string[]
): string {
  const productNamePart = productName ? `"${productName}" - ` : '';
  const styleHints = styleTags.length > 0 ? ` Style: ${styleTags.join(', ')}.` : '';

  return `[PRODUCT - DO NOT MODIFY]: ${productNamePart}${productLockDescription}
Must maintain exact proportions, colors, shape, texture, and structure. No stretching, warping, squishing, or redesign allowed.

[SCENE]: Place this exact product in a ${sceneDescription} setting. Professional product photography with soft natural lighting, clean composition. Change only the background, lighting angle, and props - never modify the product itself.${styleHints}

8K resolution, commercial e-commerce quality, sharp focus on product.`;
}

/**
 * Mock Gemini 分析（测试用）
 */
export async function analyzeWithGeminiMock(
  input: GeminiAnalysisInput
): Promise<GeminiAnalysisOutput> {
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 500));

  const { productName, productCategory, sceneTags, styleTags } = input;

  // Mock 也必须使用产品名称！
  const productNamePart = productName
    ? `"${productName}"`
    : productCategory
    ? `A ${productCategory} product`
    : 'A product';

  const mockProductLock = `${productNamePart} - A three-tiered decorative display stand with a cactus-inspired design. The structure consists of three circular ceramic plates stacked vertically, each plate being flat and round with a matte finish. The bottom tier is the largest (approximately 12 inches diameter), the middle tier is medium-sized (approximately 8 inches), and the top tier is the smallest (approximately 5 inches). The plates are connected by a central vertical post designed to look like a green cactus stem with simplified arm branches. The ceramic plates appear to be in a warm terracotta or coral pink color with a subtle matte texture. The overall height-to-width ratio is approximately 1.5:1, making it taller than wide.`;

  const sceneDescription = sceneTags.join(', ') || 'elegant studio setting';

  const finalPrompt = buildFinalPrompt(
    productName,
    mockProductLock,
    sceneDescription,
    styleTags
  );

  const negativePrompt = 'deformed product, stretched product, wrong proportions, different product, distorted shape, modified design, warped';

  console.log('\n========== MOCK: FINAL PROMPT FOR IMAGE MODEL ==========');
  console.log(finalPrompt);
  console.log('\n---------- NEGATIVE PROMPT ----------');
  console.log(negativePrompt);
  console.log('============================================\n');

  return {
    productLockDescription: mockProductLock,
    prompt: finalPrompt,
    negativePrompt,
    productAnalysis: {
      appearance: 'Three-tiered cactus-themed display stand',
      colors: 'Coral pink/terracotta plates with green cactus-shaped central post',
      material: 'Ceramic with matte finish',
      shape: 'Three circular plates stacked vertically',
      structure: 'Three tiers connected by central cactus-shaped post',
      proportions: 'Height:Width ratio approximately 1.5:1, tiered sizes decreasing from bottom to top',
    },
    model: 'mock',
    timestamp: Date.now(),
  };
}
