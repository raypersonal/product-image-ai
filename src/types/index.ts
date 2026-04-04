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

// 图片类型
export type ImageType =
  | 'main'
  | 'sellingPoint'
  | 'scene'
  | 'detail'
  | 'usage'
  | 'handheld';

// 图片Prompt
export interface ImagePrompt {
  id: string;
  type: ImageType;
  typeName: string;
  index: number;
  prompt: string;
}

// 生成的图片
export interface GeneratedImage {
  id: string;
  promptId: string;
  url: string | null;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
}

// 图片类型配置
export const IMAGE_TYPE_CONFIG: Record<ImageType, { name: string; count: number }> = {
  main: { name: '主图', count: 6 },
  sellingPoint: { name: '卖点图', count: 7 },
  scene: { name: '场景图', count: 7 },
  detail: { name: '细节图', count: 2 },
  usage: { name: '使用图', count: 2 },
  handheld: { name: '手持图', count: 2 },
};

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

// 模型选项
export const MODEL_OPTIONS = [
  { value: 'black-forest-labs/flux.2-pro', label: 'FLUX.2 Pro（高质量）' },
  { value: 'black-forest-labs/flux.2-flex', label: 'FLUX.2 Flex（均衡）' },
  { value: 'black-forest-labs/flux.2-klein-4b', label: 'FLUX.2 Klein（快速预览，最便宜）' },
];

// 图片尺寸选项（使用 aspect_ratio）
export const SIZE_OPTIONS = [
  { value: '1:1', label: '1:1 方形' },
  { value: '4:3', label: '4:3 横版' },
  { value: '3:4', label: '3:4 竖版' },
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
  { number: 3, title: '生成Prompt', description: '为26张图片生成专业Prompt' },
  { number: 4, title: '生成图片', description: '使用AI模型生成产品图片' },
  { number: 5, title: '查看下载', description: '预览和下载生成的图片' },
];
