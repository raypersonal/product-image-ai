/**
 * 场景 Prompt 自动生成器
 * 新结构：产品锁定描述 + 场景描述 + Negative Prompt
 * 设计知识注入：场景图规范 + 构图 + 色彩知识
 */

import { getTagById, getTagsEnglishDescription } from './sceneTags';
import { getColorGuideForOccasion } from '../designKnowledgeSelector';

export interface ScenePromptInput {
  // 产品信息
  productName: string;
  productCategory: string;
  productDescription: string;
  // 选中的场景标签
  selectedTags: string[];
  // 高级选项
  styleStrength: number; // 0-100
  referenceWeight: number; // 0-100
  // 是否有参考图
  hasReferenceImages: boolean;
}

export interface ScenePromptOutput {
  prompt: string;
  negativePrompt: string;
  tags: string[];
  model: string;
  timestamp: number;
}

/**
 * 构建最终 Prompt（产品锁定结构）
 * @param knowledgeHints 设计知识提示（可选）
 */
export function buildProductLockedPrompt(
  productName: string,
  productDescription: string,
  sceneDescription: string,
  styleTags: string[],
  knowledgeHints?: string
): string {
  const productNamePart = productName ? `"${productName}" - ` : '';
  const styleHints = styleTags.length > 0 ? ` Style: ${styleTags.join(', ')}.` : '';

  // 如果没有详细产品描述，使用通用描述
  const productLockPart = productDescription || 'A high-quality product with precise proportions and professional finish';

  // 设计知识提示（精简版，避免 prompt 过长）
  const designGuidance = knowledgeHints ? `\n\n[PHOTOGRAPHY GUIDANCE]: ${knowledgeHints}` : '';

  return `[PRODUCT - DO NOT MODIFY]: ${productNamePart}${productLockPart}
Must maintain exact proportions, colors, shape, texture, and structure. No stretching, warping, squishing, or redesign allowed.

[SCENE]: Place this exact product in a ${sceneDescription} setting. Professional product photography with soft natural lighting, clean composition. Change only the background, lighting angle, and props - never modify the product itself.${styleHints}${designGuidance}

8K resolution, commercial e-commerce quality, sharp focus on product.`;
}

/**
 * 获取标准 Negative Prompt
 */
export function getStandardNegativePrompt(): string {
  return 'deformed product, stretched product, wrong proportions, different product, distorted shape, modified design, warped, squished, elongated, redesigned product, incorrect colors, wrong material, blurry, low quality, amateur';
}

/**
 * 从设计知识中提取精简的关键提示
 * 避免 Prompt 过长
 */
function extractKnowledgeHints(
  productCategory: string,
  selectedTags: string[]
): string {
  const hints: string[] = [];

  // 1. 获取色彩指南（根据节日/场合标签）
  for (const tag of selectedTags) {
    const colorGuide = getColorGuideForOccasion(tag);
    if (colorGuide) {
      hints.push(colorGuide);
      break; // 只取一个
    }
  }

  // 2. 根据产品类别添加关键拍摄提示
  const lowerCategory = productCategory.toLowerCase();
  if (lowerCategory.includes('banner') || lowerCategory.includes('bunting')) {
    hints.push('Show banner hanging at realistic height, full text readable');
  } else if (lowerCategory.includes('balloon')) {
    hints.push('Show inflated balloons with correct proportions, include size reference');
  } else if (lowerCategory.includes('tableware') || lowerCategory.includes('plate')) {
    hints.push('Show complete place setting on decorated table');
  } else if (lowerCategory.includes('cake') || lowerCategory.includes('topper')) {
    hints.push('Show on actual cake/table with scale reference');
  } else if (lowerCategory.includes('backdrop')) {
    hints.push('Show full setup with person for scale reference');
  }

  // 3. 通用场景图提示
  hints.push('Rule of thirds composition, foreground-midground-background layering');
  hints.push('Product in sharp focus, background with natural bokeh');

  return hints.slice(0, 3).join('. '); // 最多3条提示
}

/**
 * Mock 生成场景 Prompt（无参考图时使用）
 */
export async function generateScenePromptMock(
  input: ScenePromptInput
): Promise<ScenePromptOutput> {
  // 模拟 API 延迟
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));

  const { productName, productCategory, productDescription, selectedTags, styleStrength } = input;

  // 获取标签的英文描述
  const tagsDescription = getTagsEnglishDescription(selectedTags);

  // 分离场景和风格标签
  const sceneTags = selectedTags.filter(id =>
    ['birthday', 'wedding', 'valentines', 'halloween', 'christmas', 'july4th', 'easter', 'babyshower',
     'outdoor', 'home', 'beach', 'garden', 'studio', 'white',
     'spring', 'summer', 'autumn', 'winter'].includes(id)
  );
  const styleTags = selectedTags.filter(id =>
    ['minimalist', 'luxury', 'rustic', 'modern', 'cute'].includes(id)
  );

  const sceneDescription = tagsDescription || 'elegant studio';

  // 根据风格强度调整场景描述
  const styleIntensityWord = styleStrength > 70 ? 'vibrant' :
                              styleStrength > 40 ? 'balanced' :
                              'subtle';

  // 构建产品描述部分
  const productDesc = productDescription
    ? productDescription
    : `A ${productCategory || 'product'}${productName ? ` called "${productName}"` : ''} with professional quality finish`;

  // 获取设计知识提示（精简版）
  const knowledgeHints = extractKnowledgeHints(productCategory || '', selectedTags);

  // 使用新的产品锁定 Prompt 结构（注入设计知识）
  const prompt = buildProductLockedPrompt(
    productName,
    productDesc,
    `${styleIntensityWord} ${sceneDescription}`,
    styleTags.map(id => getTagById(id)?.en || id),
    knowledgeHints
  );

  const negativePrompt = getStandardNegativePrompt();

  console.log('\n========== SCENE PROMPT GENERATOR (Mock) ==========');
  console.log('Product Name:', productName);
  console.log('Product Category:', productCategory);
  console.log('Scene Tags:', sceneTags.join(', '));
  console.log('Style Tags:', styleTags.join(', '));
  console.log('Knowledge Hints:', knowledgeHints);
  console.log('\n---------- FINAL PROMPT ----------');
  console.log(prompt);
  console.log('\n---------- NEGATIVE PROMPT ----------');
  console.log(negativePrompt);
  console.log('============================================\n');

  return {
    prompt,
    negativePrompt,
    tags: selectedTags,
    model: 'mock',
    timestamp: Date.now(),
  };
}

/**
 * 调用百炼 qwen-plus 生成场景 Prompt
 */
export async function generateScenePromptAPI(
  input: ScenePromptInput
): Promise<ScenePromptOutput> {
  const response = await fetch('/api/scene/generate-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate prompt');
  }

  return response.json();
}

/**
 * 智能生成场景 Prompt
 * 根据环境自动选择 Mock 或 API
 */
export async function generateScenePrompt(
  input: ScenePromptInput,
  useMock = true
): Promise<ScenePromptOutput> {
  if (useMock) {
    return generateScenePromptMock(input);
  }
  return generateScenePromptAPI(input);
}

/**
 * 根据标签生成简短描述（用于 UI 预览）
 */
export function generateQuickDescription(selectedTags: string[]): string {
  if (selectedTags.length === 0) return '';

  const descriptions: string[] = [];

  // 按类型分组描述
  const occasionTags = selectedTags.filter(id =>
    ['birthday', 'wedding', 'valentines', 'halloween', 'christmas', 'july4th', 'easter', 'babyshower'].includes(id)
  );
  const envTags = selectedTags.filter(id =>
    ['outdoor', 'home', 'beach', 'garden', 'studio', 'white'].includes(id)
  );
  const seasonTags = selectedTags.filter(id =>
    ['spring', 'summer', 'autumn', 'winter'].includes(id)
  );
  const styleTags = selectedTags.filter(id =>
    ['minimalist', 'luxury', 'rustic', 'modern', 'cute'].includes(id)
  );

  if (occasionTags.length > 0) {
    const names = occasionTags.map(id => getTagById(id)?.en).filter(Boolean);
    descriptions.push(names.join(' + '));
  }
  if (envTags.length > 0) {
    const names = envTags.map(id => getTagById(id)?.en).filter(Boolean);
    descriptions.push(names.join(' / '));
  }
  if (seasonTags.length > 0) {
    const names = seasonTags.map(id => getTagById(id)?.en).filter(Boolean);
    descriptions.push(names.join(' '));
  }
  if (styleTags.length > 0) {
    const names = styleTags.map(id => getTagById(id)?.en).filter(Boolean);
    descriptions.push(names.join(' ') + ' style');
  }

  return descriptions.join(' • ');
}
