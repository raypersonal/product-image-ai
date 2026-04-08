// 场景标签数据定义 - 完整版（9大分类）

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
  defaultExpanded?: boolean;
}

// 场景标签分类（9大分类）
export const SCENE_TAGS: Record<string, SceneTag[]> = {
  // 1. 节日/场合 (45个)
  occasion: [
    // 基础节日
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
    // 新增场合
    { id: 'bachelorette', emoji: '💃', label: '单身派对', en: 'Bachelorette / Bachelor Party' },
    { id: 'baptism', emoji: '⛪', label: '受洗/Bautizo', en: 'Baptism / Bautizo' },
    { id: 'welcomehome', emoji: '🏠', label: '欢迎回家', en: 'Welcome Home' },
    { id: 'bonvoyage', emoji: '✈️', label: '欢送', en: 'Bon Voyage / Farewell' },
    { id: 'genderreveal', emoji: '🎀', label: '性别揭晓', en: 'Gender Reveal' },
    { id: 'tailgate', emoji: '🏈', label: '比赛日', en: 'Tailgate / Game Day' },
    { id: 'sleepover', emoji: '🛏️', label: '睡衣派对', en: 'Sleepover / Pajama Party' },
    { id: 'poolparty', emoji: '🏊', label: '泳池派对', en: 'Pool Party' },
    { id: 'girlsnight', emoji: '👯', label: '闺蜜夜', en: "Girls' Night" },
    { id: 'summerween', emoji: '🎃', label: '夏日万圣', en: 'Summerween' },
    { id: 'christmasinjuly', emoji: '🎄', label: '圣诞七月', en: 'Christmas in July' },
    { id: 'uglysweater', emoji: '🧶', label: '丑毛衣派对', en: 'Ugly Sweater Party' },
    { id: 'cincodemayo', emoji: '🌮', label: '五月五', en: 'Cinco de Mayo' },
    { id: 'laborday', emoji: '👷', label: '劳动节', en: 'Labor Day' },
    { id: 'superbowl', emoji: '🏆', label: '超级碗', en: 'Super Bowl' },
    { id: 'backtoschool', emoji: '📚', label: '开学季', en: 'Back to School' },
    { id: 'diademuertos', emoji: '💀', label: '亡灵节', en: 'Día de los Muertos' },
    // 🔥🔥🔥 热门派对主题
    { id: 'dinnerparty', emoji: '🍷', label: '晚宴派对', en: 'Dinner Party' },
    { id: 'casinonight', emoji: '🎰', label: '赌场之夜', en: 'Casino Night' },
    { id: 'circus', emoji: '🎪', label: '马戏团/嘉年华', en: 'Circus / Carnival' },
    { id: 'pirate', emoji: '🏴‍☠️', label: '海盗派对', en: 'Pirate Party' },
    { id: 'fruittheme', emoji: '🍓', label: '水果主题', en: 'Fruit Theme Party' },
    { id: 'petparty', emoji: '🐕', label: '宠物派对', en: 'Pet Party' },
    { id: 'brunch', emoji: '🥂', label: '早午餐派对', en: 'Brunch Party' },
    { id: 'spaparty', emoji: '🧖', label: '自我关爱/Spa', en: 'Spa / Self-Care Party' },
  ],

  // 2. 派对元素/图案 (30个) - 新增分类
  motif: [
    { id: 'balloon', emoji: '🎈', label: '气球', en: 'Balloons' },
    { id: 'banner', emoji: '🎏', label: '横幅拉旗', en: 'Banner / Bunting' },
    { id: 'cake', emoji: '🎂', label: '蛋糕', en: 'Cake' },
    { id: 'flowers', emoji: '💐', label: '花卉', en: 'Flowers / Floral' },
    { id: 'stars', emoji: '⭐', label: '星星', en: 'Stars' },
    { id: 'crown', emoji: '👑', label: '皇冠', en: 'Crown / Tiara' },
    { id: 'confetti', emoji: '🎊', label: '纸屑彩花', en: 'Confetti' },
    { id: 'stringlights', emoji: '💡', label: '灯串', en: 'String Lights' },
    { id: 'cactus', emoji: '🌵', label: '仙人掌', en: 'Cactus' },
    { id: 'pumpkin', emoji: '🎃', label: '南瓜', en: 'Pumpkin' },
    { id: 'skull', emoji: '💀', label: '骷髅', en: 'Skull' },
    { id: 'flamingo', emoji: '🦩', label: '火烈鸟', en: 'Flamingo' },
    { id: 'pineapple', emoji: '🍍', label: '菠萝', en: 'Pineapple' },
    { id: 'dinosaur', emoji: '🦕', label: '恐龙', en: 'Dinosaur' },
    { id: 'unicorn', emoji: '🦄', label: '独角兽', en: 'Unicorn' },
    { id: 'butterfly', emoji: '🦋', label: '蝴蝶', en: 'Butterfly' },
    { id: 'hotairballoon', emoji: '🎈', label: '热气球', en: 'Hot Air Balloon' },
    { id: 'bow', emoji: '🎀', label: '蝴蝶结', en: 'Bow / Ribbon' },
    { id: 'seashell', emoji: '🐚', label: '贝壳海洋', en: 'Seashells / Ocean' },
    { id: 'teddybear', emoji: '🧸', label: '泰迪熊', en: 'Teddy Bear' },
    { id: 'lemon', emoji: '🍋', label: '柠檬', en: 'Lemon' },
    { id: 'cherry', emoji: '🍒', label: '樱桃', en: 'Cherry' },
    { id: 'strawberry', emoji: '🍓', label: '草莓', en: 'Strawberry' },
    { id: 'watermelon', emoji: '🍉', label: '西瓜', en: 'Watermelon' },
    { id: 'mermaid', emoji: '🧜', label: '美人鱼', en: 'Mermaid' },
    { id: 'sunflower', emoji: '🌻', label: '向日葵', en: 'Sunflower' },
    { id: 'bee', emoji: '🐝', label: '蜜蜂', en: 'Bee' },
    { id: 'moonstar', emoji: '🌙', label: '月亮星星', en: 'Moon & Stars' },
    { id: 'discoball', emoji: '🪩', label: '迪斯科球', en: 'Disco Ball' },
    { id: 'tarot', emoji: '🔮', label: '占星/塔罗', en: 'Astrology / Tarot' },
  ],

  // 3. 目标人群 (10个) - 新增分类
  audience: [
    { id: 'age1', emoji: '👶', label: '1岁', en: '1st Birthday' },
    { id: 'toddler', emoji: '💒', label: '幼儿(2-4)', en: 'Toddler (2-4)' },
    { id: 'kids', emoji: '🧒', label: '儿童(5-12)', en: 'Kids (5-12)' },
    { id: 'teen', emoji: '🧑', label: '青少年', en: 'Teen' },
    { id: 'adult', emoji: '🧑‍🦱', label: '成人', en: 'Adult' },
    { id: 'milestone', emoji: '🎉', label: '里程碑岁数', en: 'Milestone (30/40/50/60)' },
    { id: 'boy', emoji: '👦', label: '男孩', en: 'Boy' },
    { id: 'girl', emoji: '👧', label: '女孩', en: 'Girl' },
    { id: 'neutral', emoji: '🌈', label: '中性', en: 'Gender Neutral' },
    { id: 'pet', emoji: '🐾', label: '宠物', en: 'Pet' },
  ],

  // 4. 色彩主题 (27个)
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
    // 新增色彩
    { id: 'glacierblue', emoji: '🧊', label: '冰川蓝', en: 'Glacier Blue' },
    { id: 'amalfi', emoji: '🍋', label: '蓝黄柠檬色', en: 'Amalfi / Blue Yellow Lemon' },
    { id: 'mocha', emoji: '☕', label: '摩卡棕', en: 'Mocha Brown' },
    { id: 'jelly', emoji: '🍭', label: '果冻色', en: 'Jelly Colors' },
    { id: 'tiffany', emoji: '💎', label: 'Tiffany蓝', en: 'Tiffany Blue' },
    { id: 'cloudwhite', emoji: '☁️', label: '云白色', en: 'Cloud White' },
    { id: 'cherryred', emoji: '🍒', label: '樱桃红', en: 'Cherry Red' },
  ],

  // 5. 环境/场景 (28个)
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
    // 新增环境
    { id: 'courtyard', emoji: '🏡', label: '庭院', en: 'Courtyard / Patio' },
    { id: 'amalficoast', emoji: '🇮🇹', label: '阿马尔菲海岸', en: 'Amalfi Coast' },
    { id: 'castle', emoji: '🏰', label: '城堡庄园', en: 'Castle / Manor' },
    { id: 'space', emoji: '🚀', label: '太空/星际', en: 'Space / Galaxy' },
    { id: 'oldhollywood', emoji: '🎬', label: '老好莱坞', en: 'Old Hollywood' },
    { id: 'musicfestival', emoji: '🎸', label: '音乐节', en: 'Music Festival' },
    { id: 'mediterranean', emoji: '🏛️', label: '地中海', en: 'Mediterranean' },
    { id: 'vineyard', emoji: '🍇', label: '葡萄园', en: 'Vineyard / Winery' },
  ],

  // 6. 季节 (8个)
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

  // 7. 风格 (31个)
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
    { id: 'tropicalstyle', emoji: '🌺', label: '热带风', en: 'Tropical Style' },
    { id: 'coastal', emoji: '🐚', label: '海岸风', en: 'Coastal' },
    { id: 'farmhouse', emoji: '🏚', label: '农舍风', en: 'Farmhouse' },
    { id: 'glam', emoji: '💎', label: '奢靡', en: 'Glamorous' },
    { id: 'whimsical', emoji: '🦄', label: '梦幻', en: 'Whimsical' },
    { id: 'classic', emoji: '🏛', label: '经典', en: 'Classic' },
    { id: 'artdeco', emoji: '🎭', label: '装饰艺术', en: 'Art Deco' },
    { id: 'zen', emoji: '🧘', label: '禅意', en: 'Zen / Japanese' },
    // 新增风格
    { id: 'neoartdeco', emoji: '🔷', label: '新装饰艺术', en: 'Neo Art Deco' },
    { id: 'afrohemian', emoji: '🪘', label: '非洲波西米亚', en: 'Afrohemian' },
    { id: 'operacore', emoji: '🎭', label: '歌剧风', en: 'Operacore' },
    { id: 'chateaucore', emoji: '🏰', label: '城堡风', en: 'Châteaucore' },
    { id: 'nonna', emoji: '👵', label: '田园奶奶风', en: 'Nonna / Grandmacore' },
    { id: 'maximalist', emoji: '🎨', label: '极繁主义', en: 'Maximalist' },
    { id: 'lacecore', emoji: '🪡', label: '蕾丝风', en: 'Lacecore' },
    { id: 'western', emoji: '🤠', label: '西部牛仔', en: 'Western / Cowboy' },
    { id: 'arcade', emoji: '🕹️', label: '复古游戏', en: 'Arcade / Retro Gaming' },
    { id: 'cottagecore', emoji: '🍄', label: '魔幻蘑菇', en: 'Cottagecore / Mushroom' },
    { id: 'disco', emoji: '🪩', label: '迪斯科', en: 'Disco / 70s' },
  ],

  // 8. 光影效果 (12个) - 保持不变
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

  // 9. 摆放/构图 (16个) - 保持不变
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

// 分类元数据（9大分类）
export const SCENE_TAG_CATEGORIES: SceneTagCategory[] = [
  { id: 'occasion', name: '节日/场合', tags: SCENE_TAGS.occasion, defaultExpanded: true },
  { id: 'motif', name: '派对元素/图案', tags: SCENE_TAGS.motif, defaultExpanded: false },
  { id: 'audience', name: '目标人群', tags: SCENE_TAGS.audience, defaultExpanded: false },
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
