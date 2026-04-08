// 场景标签数据定义 - 扩展版

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
  defaultExpanded?: boolean; // 默认是否展开
}

// 场景标签分类（7大分类）
export const SCENE_TAGS: Record<string, SceneTag[]> = {
  // 1. 节日/场合
  occasion: [
    { id: 'birthday', emoji: '🎂', label: '生日', en: 'Birthday Party' },
    { id: 'wedding', emoji: '💒', label: '婚礼', en: 'Wedding' },
    { id: 'valentines', emoji: '💝', label: '情人节', en: "Valentine's Day" },
    { id: 'halloween', emoji: '🎃', label: '万圣节', en: 'Halloween' },
    { id: 'christmas', emoji: '🎅', label: '圣诞', en: 'Christmas' },
    { id: 'july4th', emoji: '🇺🇸', label: '美国国庆', en: '4th of July' },
    { id: 'easter', emoji: '🐣', label: '复活节', en: 'Easter' },
    { id: 'babyshower', emoji: '👶', label: 'Baby Shower', en: 'Baby Shower' },
    { id: 'thanksgiving', emoji: '🦃', label: '感恩节', en: 'Thanksgiving' },
    { id: 'newyear', emoji: '🎆', label: '新年', en: 'New Year' },
    { id: 'mothersday', emoji: '👩', label: '母亲节', en: "Mother's Day" },
    { id: 'fathersday', emoji: '👨', label: '父亲节', en: "Father's Day" },
    { id: 'graduation', emoji: '🎓', label: '毕业', en: 'Graduation' },
    { id: 'anniversary', emoji: '💍', label: '周年纪念', en: 'Anniversary' },
    { id: 'stpatricks', emoji: '☘️', label: '圣帕特里克', en: "St. Patrick's Day" },
    { id: 'carnival', emoji: '🎭', label: '狂欢节', en: 'Carnival' },
    { id: 'engagement', emoji: '💎', label: '订婚', en: 'Engagement' },
    { id: 'retirement', emoji: '🎊', label: '退休', en: 'Retirement Party' },
    { id: 'housewarming', emoji: '🏡', label: '乔迁', en: 'Housewarming' },
    { id: 'bridalshower', emoji: '👰', label: '新娘派对', en: 'Bridal Shower' },
  ],

  // 2. 色彩主题
  colorTheme: [
    { id: 'gold', emoji: '🌟', label: '金色', en: 'Gold / Golden' },
    { id: 'rosegold', emoji: '🌸', label: '玫瑰金', en: 'Rose Gold' },
    { id: 'silver', emoji: '🪙', label: '银色', en: 'Silver' },
    { id: 'pastel', emoji: '🍬', label: '马卡龙色', en: 'Pastel Colors' },
    { id: 'neon', emoji: '💡', label: '霓虹色', en: 'Neon Colors' },
    { id: 'rainbow', emoji: '🌈', label: '彩虹色', en: 'Rainbow' },
    { id: 'blackwhite', emoji: '⬛', label: '黑白', en: 'Black & White' },
    { id: 'pink', emoji: '💗', label: '粉色系', en: 'Pink Theme' },
    { id: 'blue', emoji: '💙', label: '蓝色系', en: 'Blue Theme' },
    { id: 'green', emoji: '💚', label: '绿色系', en: 'Green Theme' },
    { id: 'purple', emoji: '💜', label: '紫色系', en: 'Purple Theme' },
    { id: 'red', emoji: '❤️', label: '红色系', en: 'Red Theme' },
    { id: 'orange', emoji: '🧡', label: '橙色系', en: 'Orange Theme' },
    { id: 'yellow', emoji: '💛', label: '黄色系', en: 'Yellow Theme' },
    { id: 'teal', emoji: '🩵', label: '青色系', en: 'Teal Theme' },
    { id: 'coral', emoji: '🪸', label: '珊瑚色', en: 'Coral' },
    { id: 'burgundy', emoji: '🍷', label: '酒红色', en: 'Burgundy' },
    { id: 'navy', emoji: '🌊', label: '海军蓝', en: 'Navy Blue' },
    { id: 'earthy', emoji: '🤎', label: '大地色', en: 'Earthy Tones' },
    { id: 'monochrome', emoji: '⚫', label: '单色调', en: 'Monochrome' },
  ],

  // 3. 环境/场景
  environment: [
    { id: 'outdoor', emoji: '🏕', label: '户外', en: 'Outdoor' },
    { id: 'home', emoji: '🏠', label: '家庭', en: 'Home Interior' },
    { id: 'beach', emoji: '🏖', label: '海滩', en: 'Beach' },
    { id: 'garden', emoji: '🌿', label: '花园', en: 'Garden' },
    { id: 'studio', emoji: '📷', label: '影棚', en: 'Photography Studio' },
    { id: 'white', emoji: '⬜', label: '白底', en: 'White Background' },
    { id: 'livingroom', emoji: '🛋', label: '客厅', en: 'Living Room' },
    { id: 'kitchen', emoji: '🍳', label: '厨房', en: 'Kitchen' },
    { id: 'bedroom', emoji: '🛏', label: '卧室', en: 'Bedroom' },
    { id: 'bathroom', emoji: '🛁', label: '浴室', en: 'Bathroom' },
    { id: 'office', emoji: '💼', label: '办公室', en: 'Office' },
    { id: 'cafe', emoji: '☕', label: '咖啡厅', en: 'Cafe' },
    { id: 'restaurant', emoji: '🍽', label: '餐厅', en: 'Restaurant' },
    { id: 'pool', emoji: '🏊', label: '泳池', en: 'Swimming Pool' },
    { id: 'forest', emoji: '🌲', label: '森林', en: 'Forest' },
    { id: 'mountain', emoji: '⛰', label: '山景', en: 'Mountain' },
    { id: 'cityscape', emoji: '🌆', label: '城市', en: 'Cityscape' },
    { id: 'rooftop', emoji: '🏙', label: '天台', en: 'Rooftop' },
    { id: 'balcony', emoji: '🌇', label: '阳台', en: 'Balcony' },
    { id: 'tent', emoji: '⛺', label: '帐篷', en: 'Tent / Camping' },
  ],

  // 4. 季节
  season: [
    { id: 'spring', emoji: '🌸', label: '春天', en: 'Spring' },
    { id: 'summer', emoji: '☀️', label: '夏天', en: 'Summer' },
    { id: 'autumn', emoji: '🍂', label: '秋天', en: 'Autumn / Fall' },
    { id: 'winter', emoji: '❄️', label: '冬天', en: 'Winter' },
    { id: 'tropical', emoji: '🌴', label: '热带', en: 'Tropical' },
    { id: 'rainy', emoji: '🌧', label: '雨天', en: 'Rainy Day' },
    { id: 'snowy', emoji: '🌨', label: '雪景', en: 'Snowy' },
    { id: 'sunny', emoji: '🌞', label: '晴天', en: 'Sunny Day' },
  ],

  // 5. 风格
  style: [
    { id: 'minimalist', emoji: '◻️', label: '极简', en: 'Minimalist' },
    { id: 'luxury', emoji: '✨', label: '奢华', en: 'Luxury' },
    { id: 'rustic', emoji: '🪵', label: '田园', en: 'Rustic' },
    { id: 'modern', emoji: '🔲', label: '现代', en: 'Modern' },
    { id: 'cute', emoji: '🧸', label: '可爱', en: 'Cute / Kawaii' },
    { id: 'vintage', emoji: '📻', label: '复古', en: 'Vintage / Retro' },
    { id: 'boho', emoji: '🪶', label: '波西米亚', en: 'Bohemian' },
    { id: 'scandinavian', emoji: '🏔', label: '北欧', en: 'Scandinavian' },
    { id: 'industrial', emoji: '🏭', label: '工业', en: 'Industrial' },
    { id: 'romantic', emoji: '💕', label: '浪漫', en: 'Romantic' },
    { id: 'elegant', emoji: '👗', label: '优雅', en: 'Elegant' },
    { id: 'playful', emoji: '🎈', label: '活泼', en: 'Playful' },
    { id: 'tropical', emoji: '🌺', label: '热带风', en: 'Tropical Style' },
    { id: 'coastal', emoji: '🐚', label: '海岸风', en: 'Coastal' },
    { id: 'farmhouse', emoji: '🏚', label: '农舍风', en: 'Farmhouse' },
    { id: 'glam', emoji: '💎', label: '奢靡', en: 'Glamorous' },
    { id: 'whimsical', emoji: '🦄', label: '梦幻', en: 'Whimsical' },
    { id: 'classic', emoji: '🏛', label: '经典', en: 'Classic' },
    { id: 'artdeco', emoji: '🎭', label: '装饰艺术', en: 'Art Deco' },
    { id: 'zen', emoji: '🧘', label: '禅意', en: 'Zen / Japanese' },
  ],

  // 6. 光影效果
  lighting: [
    { id: 'naturallight', emoji: '🌤', label: '自然光', en: 'Natural Light' },
    { id: 'goldenhour', emoji: '🌅', label: '黄金时刻', en: 'Golden Hour' },
    { id: 'softlight', emoji: '💡', label: '柔光', en: 'Soft Light' },
    { id: 'dramatic', emoji: '🎬', label: '戏剧光', en: 'Dramatic Lighting' },
    { id: 'backlit', emoji: '🌄', label: '逆光', en: 'Backlit' },
    { id: 'candlelight', emoji: '🕯', label: '烛光', en: 'Candlelight' },
    { id: 'neonlight', emoji: '🔆', label: '霓虹灯光', en: 'Neon Light' },
    { id: 'fairylight', emoji: '✨', label: '星星灯', en: 'Fairy Lights' },
    { id: 'spotlight', emoji: '🔦', label: '聚光灯', en: 'Spotlight' },
    { id: 'shadowplay', emoji: '🌑', label: '光影', en: 'Shadow Play' },
    { id: 'sunset', emoji: '🌇', label: '日落光', en: 'Sunset Light' },
    { id: 'bluelight', emoji: '🌙', label: '蓝调光', en: 'Blue Hour' },
  ],

  // 7. 摆放/构图
  composition: [
    { id: 'flatlay', emoji: '📐', label: '平铺', en: 'Flat Lay' },
    { id: 'lifestyle', emoji: '🖼', label: '生活场景', en: 'Lifestyle' },
    { id: 'closeup', emoji: '🔍', label: '特写', en: 'Close-up' },
    { id: 'groupshot', emoji: '👥', label: '组合', en: 'Group Shot' },
    { id: 'floating', emoji: '🎈', label: '悬浮', en: 'Floating' },
    { id: 'hanging', emoji: '🪝', label: '悬挂', en: 'Hanging' },
    { id: 'stacked', emoji: '📚', label: '堆叠', en: 'Stacked' },
    { id: 'scattered', emoji: '🌸', label: '散落', en: 'Scattered' },
    { id: 'inhand', emoji: '🤲', label: '手持', en: 'In Hand' },
    { id: 'inuse', emoji: '🎬', label: '使用中', en: 'In Use' },
    { id: 'overhead', emoji: '⬇️', label: '俯视', en: 'Overhead Shot' },
    { id: 'sideangle', emoji: '↘️', label: '侧角', en: 'Side Angle' },
    { id: 'symmetry', emoji: '⚖️', label: '对称', en: 'Symmetry' },
    { id: 'diagonal', emoji: '📏', label: '对角线', en: 'Diagonal' },
    { id: 'framed', emoji: '🖼', label: '框中框', en: 'Framed' },
    { id: 'reflection', emoji: '🪞', label: '倒影', en: 'Reflection' },
  ],
};

// 分类元数据（7大分类）
export const SCENE_TAG_CATEGORIES: SceneTagCategory[] = [
  { id: 'occasion', name: '节日/场合', tags: SCENE_TAGS.occasion, defaultExpanded: true },
  { id: 'colorTheme', name: '色彩主题', tags: SCENE_TAGS.colorTheme, defaultExpanded: true },
  { id: 'environment', name: '环境/场景', tags: SCENE_TAGS.environment, defaultExpanded: false },
  { id: 'season', name: '季节', tags: SCENE_TAGS.season, defaultExpanded: false },
  { id: 'style', name: '风格', tags: SCENE_TAGS.style, defaultExpanded: false },
  { id: 'lighting', name: '光影效果', tags: SCENE_TAGS.lighting, defaultExpanded: false },
  { id: 'composition', name: '摆放/构图', tags: SCENE_TAGS.composition, defaultExpanded: false },
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

// 搜索标签（支持中文和英文）
export function searchTags(query: string): SceneTag[] {
  if (!query.trim()) return [];
  const lowerQuery = query.toLowerCase().trim();
  return getAllTags().filter(tag =>
    tag.label.toLowerCase().includes(lowerQuery) ||
    tag.en.toLowerCase().includes(lowerQuery) ||
    tag.id.toLowerCase().includes(lowerQuery)
  );
}
