/**
 * 视频Prompt自动生成器
 * 根据运镜+动效+产品信息生成英文视频Prompt
 */

// 运镜类型
export interface CameraMotion {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
}

export const CAMERA_MOTIONS: CameraMotion[] = [
  { id: 'push_in', name: '推近', nameEn: 'Push In / Dolly In', icon: '🔍', description: '镜头缓慢推近产品' },
  { id: 'pull_out', name: '拉远', nameEn: 'Pull Out / Dolly Out', icon: '🔭', description: '镜头缓慢拉远' },
  { id: 'orbit_360', name: '环绕360°', nameEn: '360 Orbit', icon: '🔄', description: '镜头环绕产品一周' },
  { id: 'pan_left', name: '左平移', nameEn: 'Pan Left', icon: '⬅️', description: '镜头向左平移' },
  { id: 'pan_right', name: '右平移', nameEn: 'Pan Right', icon: '➡️', description: '镜头向右平移' },
  { id: 'tilt_up', name: '上升', nameEn: 'Tilt Up / Crane Up', icon: '⬆️', description: '镜头向上移动' },
  { id: 'tilt_down', name: '下降', nameEn: 'Tilt Down / Crane Down', icon: '⬇️', description: '镜头向下移动' },
  { id: 'static', name: '固定', nameEn: 'Static / Locked', icon: '📌', description: '镜头固定不动' },
];

// 动效标签
export interface EffectTag {
  id: string;
  name: string;
  nameEn: string;
  category: string;
}

export const EFFECT_TAGS: EffectTag[] = [
  // 派对元素
  { id: 'confetti', name: '彩带飘落', nameEn: 'colorful confetti falling gently', category: 'party' },
  { id: 'balloons', name: '气球飘动', nameEn: 'balloons floating and bobbing', category: 'party' },
  { id: 'fireworks', name: '烟花绽放', nameEn: 'fireworks bursting in the background', category: 'party' },
  { id: 'sparkles', name: '粒子闪烁', nameEn: 'sparkles and glitter particles twinkling', category: 'party' },
  { id: 'streamers', name: '彩带飘舞', nameEn: 'streamers flowing in the air', category: 'party' },

  // 自然效果
  { id: 'breeze', name: '微风吹拂', nameEn: 'gentle breeze rustling', category: 'nature' },
  { id: 'leaves', name: '落叶飘动', nameEn: 'autumn leaves falling slowly', category: 'nature' },
  { id: 'petals', name: '花瓣飘落', nameEn: 'flower petals floating down', category: 'nature' },
  { id: 'snow', name: '雪花飘落', nameEn: 'snowflakes drifting down', category: 'nature' },
  { id: 'rain', name: '雨滴', nameEn: 'raindrops falling on surface', category: 'nature' },

  // 光影效果
  { id: 'light_change', name: '光影变化', nameEn: 'dynamic lighting shifting', category: 'light' },
  { id: 'golden_hour', name: '黄金时刻', nameEn: 'warm golden hour sunlight', category: 'light' },
  { id: 'lens_flare', name: '镜头光晕', nameEn: 'cinematic lens flare', category: 'light' },
  { id: 'bokeh', name: '光斑闪烁', nameEn: 'bokeh lights twinkling', category: 'light' },
  { id: 'spotlight', name: '聚光灯', nameEn: 'spotlight highlighting the product', category: 'light' },

  // 动态效果
  { id: 'rotate', name: '旋转展示', nameEn: 'product slowly rotating', category: 'motion' },
  { id: 'ripple', name: '水波纹', nameEn: 'water ripple effect', category: 'motion' },
  { id: 'float', name: '悬浮漂动', nameEn: 'product gently floating', category: 'motion' },
  { id: 'zoom_pulse', name: '缩放脉动', nameEn: 'subtle zoom pulse', category: 'motion' },
  { id: 'shake', name: '轻微晃动', nameEn: 'subtle vibration movement', category: 'motion' },
];

// 根据场景标签推荐运镜和动效
export function getRecommendedEffects(sceneTags: string[]): {
  cameraMotion: string;
  effects: string[];
} {
  const tagSet = new Set(sceneTags.map(t => t.toLowerCase()));

  // 默认推荐
  let cameraMotion = 'push_in';
  const effects: string[] = [];

  // 根据场景标签推荐
  if (tagSet.has('birthday') || tagSet.has('生日')) {
    cameraMotion = 'push_in';
    effects.push('confetti', 'sparkles');
  } else if (tagSet.has('wedding') || tagSet.has('婚礼')) {
    cameraMotion = 'orbit_360';
    effects.push('petals', 'bokeh', 'light_change');
  } else if (tagSet.has('christmas') || tagSet.has('圣诞')) {
    cameraMotion = 'pull_out';
    effects.push('snow', 'sparkles', 'bokeh');
  } else if (tagSet.has('halloween') || tagSet.has('万圣节')) {
    cameraMotion = 'push_in';
    effects.push('sparkles', 'light_change');
  } else if (tagSet.has('outdoor') || tagSet.has('户外')) {
    cameraMotion = 'pan_right';
    effects.push('breeze', 'light_change');
  } else if (tagSet.has('luxury') || tagSet.has('奢华')) {
    cameraMotion = 'orbit_360';
    effects.push('bokeh', 'spotlight', 'rotate');
  } else if (tagSet.has('minimalist') || tagSet.has('极简')) {
    cameraMotion = 'static';
    effects.push('light_change');
  }

  return { cameraMotion, effects };
}

// 生成视频Prompt
export interface VideoPromptInput {
  productName: string;
  productCategory: string;
  productDescription: string;
  cameraMotion: string;
  selectedEffects: string[];
  customText?: string;
  duration: number;
}

export function generateVideoPrompt(input: VideoPromptInput): string {
  const parts: string[] = [];

  // 1. 产品描述
  const productPart = input.productDescription
    ? `A ${input.productCategory || 'product'} "${input.productName}" - ${input.productDescription}`
    : `A ${input.productCategory || 'high-quality product'}${input.productName ? ` called "${input.productName}"` : ''}`;
  parts.push(productPart);

  // 2. 运镜描述
  const motion = CAMERA_MOTIONS.find(m => m.id === input.cameraMotion);
  if (motion) {
    parts.push(`Camera movement: ${motion.nameEn}`);
  }

  // 3. 动效描述
  if (input.selectedEffects.length > 0) {
    const effectDescriptions = input.selectedEffects
      .map(id => EFFECT_TAGS.find(e => e.id === id)?.nameEn)
      .filter(Boolean);
    if (effectDescriptions.length > 0) {
      parts.push(`Visual effects: ${effectDescriptions.join(', ')}`);
    }
  }

  // 4. 自定义文本
  if (input.customText) {
    parts.push(input.customText);
  }

  // 5. 通用视频质量描述
  parts.push('Cinematic product video, professional lighting, smooth motion, high quality 1080P, commercial advertisement style');

  // 6. 时长提示
  parts.push(`${input.duration} second video`);

  return parts.join('. ');
}

// 获取运镜选项
export function getCameraMotionById(id: string): CameraMotion | undefined {
  return CAMERA_MOTIONS.find(m => m.id === id);
}

// 获取动效选项
export function getEffectTagById(id: string): EffectTag | undefined {
  return EFFECT_TAGS.find(e => e.id === id);
}

// 按类别分组动效
export function getEffectsByCategory(): Record<string, EffectTag[]> {
  const grouped: Record<string, EffectTag[]> = {};
  for (const effect of EFFECT_TAGS) {
    if (!grouped[effect.category]) {
      grouped[effect.category] = [];
    }
    grouped[effect.category].push(effect);
  }
  return grouped;
}

// 类别名称映射
export const EFFECT_CATEGORY_NAMES: Record<string, string> = {
  party: '派对元素',
  nature: '自然效果',
  light: '光影效果',
  motion: '动态效果',
};
