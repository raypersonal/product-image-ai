// 场景标签数据定义

export interface SceneTag {
  id: string;
  emoji: string;
  label: string;
  en: string;
}

export interface SceneTagCategory {
  id: string;
  name: string;
  tags: SceneTag[];
}

// 场景标签分类
export const SCENE_TAGS: Record<string, SceneTag[]> = {
  occasion: [
    { id: 'birthday', emoji: '🎂', label: '生日', en: 'Birthday Party' },
    { id: 'wedding', emoji: '💒', label: '婚礼', en: 'Wedding' },
    { id: 'valentines', emoji: '💝', label: '情人节', en: "Valentine's Day" },
    { id: 'halloween', emoji: '🎃', label: '万圣节', en: 'Halloween' },
    { id: 'christmas', emoji: '🎅', label: '圣诞', en: 'Christmas' },
    { id: 'july4th', emoji: '🇺🇸', label: '国庆', en: '4th of July' },
    { id: 'easter', emoji: '🐣', label: '复活节', en: 'Easter' },
    { id: 'babyshower', emoji: '👶', label: 'Baby Shower', en: 'Baby Shower' },
  ],
  environment: [
    { id: 'outdoor', emoji: '🏕', label: '户外', en: 'Outdoor' },
    { id: 'home', emoji: '🏠', label: '家庭', en: 'Home Interior' },
    { id: 'beach', emoji: '🏖', label: '海滩', en: 'Beach' },
    { id: 'garden', emoji: '🌿', label: '花园', en: 'Garden' },
    { id: 'studio', emoji: '📷', label: '影棚', en: 'Photography Studio' },
    { id: 'white', emoji: '⬜', label: '白底', en: 'White Background' },
  ],
  season: [
    { id: 'spring', emoji: '🌸', label: '春天', en: 'Spring' },
    { id: 'summer', emoji: '☀️', label: '夏天', en: 'Summer' },
    { id: 'autumn', emoji: '🍂', label: '秋天', en: 'Autumn' },
    { id: 'winter', emoji: '❄️', label: '冬天', en: 'Winter' },
  ],
  style: [
    { id: 'minimalist', emoji: '◻️', label: '极简', en: 'Minimalist' },
    { id: 'luxury', emoji: '✨', label: '奢华', en: 'Luxury' },
    { id: 'rustic', emoji: '🪵', label: '田园', en: 'Rustic' },
    { id: 'modern', emoji: '🔲', label: '现代', en: 'Modern' },
    { id: 'cute', emoji: '🧸', label: '可爱', en: 'Cute / Kawaii' },
  ],
};

// 分类元数据
export const SCENE_TAG_CATEGORIES: SceneTagCategory[] = [
  { id: 'occasion', name: '节日/场合', tags: SCENE_TAGS.occasion },
  { id: 'environment', name: '环境', tags: SCENE_TAGS.environment },
  { id: 'season', name: '季节', tags: SCENE_TAGS.season },
  { id: 'style', name: '风格', tags: SCENE_TAGS.style },
];

// 获取所有标签的扁平数组
export function getAllTags(): SceneTag[] {
  return Object.values(SCENE_TAGS).flat();
}

// 根据ID查找标签
export function getTagById(id: string): SceneTag | undefined {
  return getAllTags().find(tag => tag.id === id);
}

// 根据ID数组获取标签的英文描述
export function getTagsEnglishDescription(tagIds: string[]): string {
  return tagIds
    .map(id => getTagById(id))
    .filter(Boolean)
    .map(tag => tag!.en)
    .join(', ');
}
