/**
 * 场景 Prompt 自动生成器
 * Phase 2: 使用 Mock 数据测试 UI
 * Phase 3: 接入百炼 qwen-plus API
 */

import { getTagById, getTagsEnglishDescription } from './sceneTags';

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
  tags: string[];
  model: string;
  timestamp: number;
}

/**
 * Mock 生成场景 Prompt（Phase 2 测试用）
 */
export async function generateScenePromptMock(
  input: ScenePromptInput
): Promise<ScenePromptOutput> {
  // 模拟 API 延迟
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));

  const { productName, productCategory, selectedTags, styleStrength, hasReferenceImages } = input;

  // 获取标签的英文描述
  const tagsDescription = getTagsEnglishDescription(selectedTags);

  // 根据风格强度调整措辞
  const styleIntensity = styleStrength > 70 ? 'vibrant and bold' :
                         styleStrength > 40 ? 'balanced and natural' :
                         'subtle and minimalist';

  // 构建 Prompt
  const productPart = productName
    ? `A ${productCategory || 'product'} "${productName}"`
    : 'A product';

  const scenePart = tagsDescription
    ? `in a ${tagsDescription} setting`
    : 'in an elegant setting';

  const stylePart = `with ${styleIntensity} styling`;

  const lightingPart = selectedTags.includes('studio')
    ? 'professional studio lighting with soft shadows'
    : selectedTags.includes('outdoor') || selectedTags.includes('beach')
    ? 'natural sunlight with warm golden hour tones'
    : 'soft ambient lighting';

  const compositionPart = 'centered composition with shallow depth of field';

  const referencePart = hasReferenceImages
    ? 'Maintain the exact product appearance, colors, and proportions from the reference image.'
    : '';

  // 组装完整 Prompt
  const prompt = [
    `${productPart} ${scenePart}, ${stylePart}.`,
    `${lightingPart}, ${compositionPart}.`,
    'High-quality product photography, 8K resolution, professional commercial style.',
    'Clean and appealing presentation suitable for e-commerce.',
    referencePart,
  ].filter(Boolean).join(' ');

  return {
    prompt: prompt.trim(),
    tags: selectedTags,
    model: 'mock',
    timestamp: Date.now(),
  };
}

/**
 * 调用百炼 qwen-plus 生成场景 Prompt
 * TODO: Phase 3 实现
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
  useMock = true // Phase 2 默认使用 Mock
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
