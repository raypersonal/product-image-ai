// 参考图片
export interface ReferenceImage {
  id: string;
  base64: string;       // data:image/xxx;base64,...
  description: string;  // 用户填写的描述
  filename: string;
}

// 产品信息
export interface ProductInfo {
  name: string;
  category: string;
  description: string;
  sellingPoints: string[];
  targetAudience: string;
  stylePreferences: string[];
}

// AI分析结果
export interface AnalysisResult {
  style: string;
  colorPalette: string;
  targetAudience: string;
  sellingPoints: string[];
  scenes: string[];
  // 参考图片分析结果（可选）
  referenceAnalysis?: {
    appearance: string;      // 产品外观描述
    packaging: string;       // 包装特征
    competitorDiff: string;  // 竞品差异点
    designElements: string;  // 可借鉴的设计元素
  };
}

// 尺寸选项定义
export interface SizeOption {
  label: string;
  value: string;
  aspectRatio: string;  // OpenRouter 支持的标准比例
}

// 图片类型配置（新版本，支持更多选项）
export interface ImageTypeConfig {
  id: string;
  name: string;
  count: number;
  isCore: boolean;        // 是否为核心类型（默认勾选）
  sizeOptions: SizeOption[];
  defaultSize: string;
  promptHint: string;     // 给 AI 的提示，帮助生成该类型的 Prompt
}

// 所有图片类型ID
export type ImageTypeId =
  // 核心类型
  | 'main'
  | 'sellingPoint'
  | 'scene'
  | 'detail'
  | 'usage'
  | 'handheld'
  // 附加类型
  | 'aplus_standard'
  | 'aplus_premium'
  | 'brand_store_banner'
  | 'brand_story'
  | 'store_tile'
  | 'video_cover'
  | 'social_post';

// 向后兼容：旧的 ImageType
export type ImageType = ImageTypeId;

// 完整的图片类型配置
export const ALL_IMAGE_TYPES: ImageTypeConfig[] = [
  // === 核心类型（默认勾选）===
  {
    id: 'main',
    name: '主图',
    count: 6,
    isCore: true,
    sizeOptions: [
      { label: '1:1 方形（亚马逊要求）', value: '1:1', aspectRatio: '1:1' }
    ],
    defaultSize: '1:1',
    promptHint: 'Amazon main product image, clean pure white background, product fills 85% of frame, professional studio lighting, high resolution product photography'
  },
  {
    id: 'sellingPoint',
    name: '卖点图',
    count: 7,
    isCore: true,
    sizeOptions: [
      { label: '1:1 方形', value: '1:1', aspectRatio: '1:1' },
      { label: '4:3 横版', value: '4:3', aspectRatio: '4:3' },
      { label: '3:4 竖版', value: '3:4', aspectRatio: '3:4' }
    ],
    defaultSize: '1:1',
    promptHint: 'Amazon infographic style, highlight specific product features with visual emphasis, clean background with text-friendly space'
  },
  {
    id: 'scene',
    name: '场景图',
    count: 7,
    isCore: true,
    sizeOptions: [
      { label: '1:1 方形', value: '1:1', aspectRatio: '1:1' },
      { label: '4:3 横版', value: '4:3', aspectRatio: '4:3' },
      { label: '3:4 竖版', value: '3:4', aspectRatio: '3:4' },
      { label: '16:9 宽屏', value: '16:9', aspectRatio: '16:9' }
    ],
    defaultSize: '1:1',
    promptHint: 'Lifestyle scene showing product in use, natural environment, warm and inviting atmosphere, realistic setting'
  },
  {
    id: 'detail',
    name: '细节图',
    count: 2,
    isCore: true,
    sizeOptions: [
      { label: '1:1 方形', value: '1:1', aspectRatio: '1:1' },
      { label: '4:3 横版', value: '4:3', aspectRatio: '4:3' }
    ],
    defaultSize: '1:1',
    promptHint: 'Close-up macro shot of product details, textures, materials, patterns, craftsmanship quality'
  },
  {
    id: 'usage',
    name: '使用图',
    count: 2,
    isCore: true,
    sizeOptions: [
      { label: '1:1 方形', value: '1:1', aspectRatio: '1:1' },
      { label: '3:4 竖版', value: '3:4', aspectRatio: '3:4' },
      { label: '4:3 横版', value: '4:3', aspectRatio: '4:3' }
    ],
    defaultSize: '1:1',
    promptHint: 'Step-by-step demonstration, how-to use the product, clear instructional composition'
  },
  {
    id: 'handheld',
    name: '手持图',
    count: 2,
    isCore: true,
    sizeOptions: [
      { label: '1:1 方形', value: '1:1', aspectRatio: '1:1' },
      { label: '3:4 竖版', value: '3:4', aspectRatio: '3:4' }
    ],
    defaultSize: '1:1',
    promptHint: 'Product held by human hands for scale reference, natural hand positioning, clean background'
  },

  // === 附加类型（默认不勾选）===
  {
    id: 'aplus_standard',
    name: '标准A+图',
    count: 3,
    isCore: false,
    sizeOptions: [
      { label: '标准模块 970×600', value: '970:600', aspectRatio: '3:2' },
      { label: '方形模块 300×300', value: '1:1', aspectRatio: '1:1' }
    ],
    defaultSize: '970:600',
    promptHint: 'Amazon A+ Content standard module, clean product showcase with feature highlights, professional product photography style, compose for 970×600 pixel canvas'
  },
  {
    id: 'aplus_premium',
    name: '高级A+图',
    count: 3,
    isCore: false,
    sizeOptions: [
      { label: '高级A+横幅 1464×600', value: '1464:600', aspectRatio: '16:9' }
    ],
    defaultSize: '1464:600',
    promptHint: 'Amazon Premium A+ Content wide banner module, cinematic product showcase, ultra-wide composition with lifestyle elements, compose for 1464×600 pixel canvas'
  },
  {
    id: 'brand_store_banner',
    name: '品牌旗舰店Banner',
    count: 2,
    isCore: false,
    sizeOptions: [
      { label: '旗舰店横幅 3000×600', value: '3000:600', aspectRatio: '21:9' },
      { label: '旗舰店横幅 1500×600', value: '1500:600', aspectRatio: '16:9' }
    ],
    defaultSize: '3000:600',
    promptHint: 'Amazon Brand Store hero banner, wide panoramic brand showcase, premium brand identity with product lifestyle, compose for ultra-wide 3000×600 pixel canvas'
  },
  {
    id: 'brand_story',
    name: '品牌故事图',
    count: 2,
    isCore: false,
    sizeOptions: [
      { label: '品牌故事主图 1464×625', value: '1464:625', aspectRatio: '16:9' }
    ],
    defaultSize: '1464:625',
    promptHint: 'Amazon Brand Story banner, brand narrative visual, emotional brand storytelling with product integration, compose for 1464×625 pixel canvas'
  },
  {
    id: 'store_tile',
    name: '旗舰店商品瓷砖',
    count: 2,
    isCore: false,
    sizeOptions: [
      { label: '方形瓷砖 800×800', value: '1:1', aspectRatio: '1:1' },
      { label: '横幅瓷砖 1500×750', value: '2:1', aspectRatio: '2:1' }
    ],
    defaultSize: '1:1',
    promptHint: 'Amazon Brand Store product tile, clean product display with brand-consistent styling'
  },
  {
    id: 'video_cover',
    name: '视频封面图',
    count: 1,
    isCore: false,
    sizeOptions: [
      { label: '视频封面 16:9', value: '16:9', aspectRatio: '16:9' }
    ],
    defaultSize: '16:9',
    promptHint: 'Product video thumbnail, eye-catching hero shot with play button friendly composition, cinematic product photography'
  },
  {
    id: 'social_post',
    name: '社媒/帖子图',
    count: 2,
    isCore: false,
    sizeOptions: [
      { label: 'Amazon Post 1:1', value: '1:1', aspectRatio: '1:1' },
      { label: '社媒横图 1200×628', value: '1200:628', aspectRatio: '2:1' }
    ],
    defaultSize: '1:1',
    promptHint: 'Social media product post, lifestyle-focused with natural setting, Instagram-worthy product photography, engaging and shareable'
  }
];

// 获取类型配置的辅助函数
export function getTypeConfig(typeId: string): ImageTypeConfig | undefined {
  return ALL_IMAGE_TYPES.find(t => t.id === typeId);
}

// 获取核心类型列表
export function getCoreTypes(): ImageTypeConfig[] {
  return ALL_IMAGE_TYPES.filter(t => t.isCore);
}

// 获取附加类型列表
export function getAdditionalTypes(): ImageTypeConfig[] {
  return ALL_IMAGE_TYPES.filter(t => !t.isCore);
}

// 向后兼容：旧的 IMAGE_TYPE_CONFIG（只包含核心类型）
export const IMAGE_TYPE_CONFIG: Record<string, { name: string; count: number }> = Object.fromEntries(
  getCoreTypes().map(t => [t.id, { name: t.name, count: t.count }])
);

// 图片Prompt（更新版，支持类型ID）
export interface ImagePrompt {
  id: string;
  type: ImageTypeId;
  typeName: string;
  index: number;
  prompt: string;
}

// 生成的图片（更新版，包含尺寸信息）
export interface GeneratedImage {
  id: string;
  promptId: string;
  url: string | null;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
  aspectRatio?: string;  // 实际使用的宽高比
}

// 产品类别选项
export const CATEGORY_OPTIONS = [
  { value: 'birthday', label: '生日派对' },
  { value: 'wedding', label: '婚礼' },
  { value: 'babyshower', label: '婴儿派对' },
  { value: 'holiday', label: '节日庆典' },
  { value: 'graduation', label: '毕业派对' },
  { value: 'other', label: '其他' },
];

// 风格偏好选项
export const STYLE_OPTIONS = [
  { value: 'minimal', label: '简约' },
  { value: 'cartoon', label: '卡通' },
  { value: 'premium', label: '高端' },
  { value: 'colorful', label: '缤纷' },
  { value: 'rustic', label: '田园' },
  { value: 'gothic', label: '哥特' },
];

// 提供商类型
export type ModelProvider = 'openrouter' | 'dashscope';

// 模型选项通用接口
export interface ModelOption {
  value: string;
  label: string;
  provider: ModelProvider;
  pricePerImage?: number;  // 图片模型价格
  isFree?: boolean;        // 是否免费额度
}

// ========== 分析模型选项（Step 2）==========
export const ANALYZE_MODEL_OPTIONS: ModelOption[] = [
  // DashScope 百炼
  { value: 'qwen-plus', label: '通义千问-Plus（百炼默认）', provider: 'dashscope' },
  { value: 'qwen-max', label: '通义千问-Max（百炼高级）', provider: 'dashscope' },
  // OpenRouter
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat', provider: 'openrouter' },
  { value: 'openai/gpt-4o', label: 'GPT-4o', provider: 'openrouter' },
];

// 分析模型 - Vision 专用（用于参考图片分析）
export const VISION_MODEL_OPTIONS: ModelOption[] = [
  // DashScope 百炼
  { value: 'qwen-vl-plus', label: '通义千问VL-Plus（百炼视觉）', provider: 'dashscope' },
  { value: 'qwen-vl-max', label: '通义千问VL-Max（百炼视觉高级）', provider: 'dashscope' },
  // OpenRouter
  { value: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash', provider: 'openrouter' },
  { value: 'openai/gpt-4o', label: 'GPT-4o Vision', provider: 'openrouter' },
];

// ========== Prompt 生成模型选项（Step 3）==========
export const PROMPT_MODEL_OPTIONS: ModelOption[] = [
  // DashScope 百炼（免费额度）
  { value: 'qwen-plus', label: '通义千问-Plus（百炼，免费额度）', provider: 'dashscope', isFree: true },
  { value: 'qwen-max', label: '通义千问-Max（百炼，免费额度）', provider: 'dashscope', isFree: true },
  // OpenRouter
  { value: 'deepseek/deepseek-chat-v3-0324', label: 'DeepSeek V3', provider: 'openrouter' },
  { value: 'openai/gpt-4o', label: 'GPT-4o', provider: 'openrouter' },
  { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet', provider: 'openrouter' },
];

// ========== 图片生成模型选项（Step 4）==========
export const IMAGE_MODEL_OPTIONS: ModelOption[] = [
  // DashScope 百炼（有免费额度）
  { value: 'wanx2.1-t2i-turbo', label: 'Wanx 2.1 Turbo（百炼，有免费额度）', provider: 'dashscope', pricePerImage: 0, isFree: true },
  { value: 'wanx2.1-t2i-plus', label: 'Wanx 2.1 Plus（百炼，高质量）', provider: 'dashscope', pricePerImage: 0.02 },
  { value: 'wanx-v1', label: 'Wanx V1（百炼经典）', provider: 'dashscope', pricePerImage: 0, isFree: true },
  // OpenRouter FLUX
  { value: 'black-forest-labs/flux.2-pro', label: 'FLUX.2 Pro（高质量）', provider: 'openrouter', pricePerImage: 0.08 },
  { value: 'black-forest-labs/flux.2-flex', label: 'FLUX.2 Flex（均衡）', provider: 'openrouter', pricePerImage: 0.04 },
  { value: 'black-forest-labs/flux.2-klein-4b', label: 'FLUX.2 Klein（快速预览）', provider: 'openrouter', pricePerImage: 0.014 },
];

// 向后兼容
export const MODEL_OPTIONS = IMAGE_MODEL_OPTIONS;

// 获取模型选项的提供商
export function getModelProvider(modelId: string): ModelProvider {
  const allModels = [...ANALYZE_MODEL_OPTIONS, ...VISION_MODEL_OPTIONS, ...PROMPT_MODEL_OPTIONS, ...IMAGE_MODEL_OPTIONS];
  const model = allModels.find(m => m.value === modelId);
  return model?.provider || 'openrouter';
}

// 判断模型是否为百炼
export function isDashScopeModel(modelId: string): boolean {
  return getModelProvider(modelId) === 'dashscope';
}

// 判断模型是否有免费额度
export function isFreeTierModel(modelId: string): boolean {
  const allModels = [...PROMPT_MODEL_OPTIONS, ...IMAGE_MODEL_OPTIONS];
  const model = allModels.find(m => m.value === modelId);
  return model?.isFree || false;
}

// 图片尺寸选项（通用，向后兼容）
export const SIZE_OPTIONS = [
  { value: '1:1', label: '1:1 方形' },
  { value: '4:3', label: '4:3 横版' },
  { value: '3:4', label: '3:4 竖版' },
  { value: '16:9', label: '16:9 宽屏' },
  { value: '9:16', label: '9:16 竖屏' },
  { value: '21:9', label: '21:9 超宽' },
  { value: '2:1', label: '2:1 横幅' },
  { value: '3:2', label: '3:2 横版' },
];

// 飞书记录
export interface FeishuRecord {
  record_id: string;
  fields: Record<string, unknown>;
}

// 步骤信息
export interface StepInfo {
  number: number;
  title: string;
  description: string;
}

export const STEPS: StepInfo[] = [
  { number: 1, title: '产品信息', description: '输入产品基本信息和卖点' },
  { number: 2, title: 'AI分析', description: 'AI分析产品特点和目标人群' },
  { number: 3, title: '生成Prompt', description: '为已选类型生成专业Prompt' },
  { number: 4, title: '生成图片', description: '使用AI模型生成产品图片' },
  { number: 5, title: '查看下载', description: '预览和下载生成的图片' },
];

// 获取模型价格
export function getModelPrice(modelId: string): number {
  const model = IMAGE_MODEL_OPTIONS.find(m => m.value === modelId);
  return model?.pricePerImage || 0.04;
}

// 计算预估费用
export function calculateEstimatedCost(imageCount: number, modelId: string): number {
  const pricePerImage = getModelPrice(modelId);
  return imageCount * pricePerImage;
}

// 格式化费用显示（支持免费额度）
export function formatCostDisplay(imageCount: number, modelId: string): string {
  const isFree = isFreeTierModel(modelId);
  const cost = calculateEstimatedCost(imageCount, modelId);

  if (isFree) {
    return '免费额度';
  }
  return `$${cost.toFixed(2)}`;
}

// DashScope 尺寸格式转换（1:1 -> 1024*1024）
export function convertAspectRatioToDashScope(aspectRatio: string): string {
  const sizeMap: Record<string, string> = {
    '1:1': '1024*1024',
    '4:3': '1024*768',
    '3:4': '768*1024',
    '16:9': '1280*720',
    '9:16': '720*1280',
    '21:9': '1260*540',
    '2:1': '1024*512',
    '3:2': '1024*683',
  };
  return sizeMap[aspectRatio] || '1024*1024';
}
