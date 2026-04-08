// 设计知识库智能选择器
// 根据图片类型和产品类别，按需选择2-3段知识注入Prompt

import {
  AMAZON_IMAGE_RULES,
  COMPOSITION_RULES,
  COMPOSITION_RULES_COMPACT,
  COLOR_THEORY,
  COLOR_THEORY_COMPACT,
  PARTY_CATEGORY_GUIDE,
} from './designKnowledge';

// 图片类型ID
export type ImageTypeId =
  | 'main'
  | 'sellingPoint'
  | 'scene'
  | 'detail'
  | 'usage'
  | 'handheld'
  | 'aplus_standard'
  | 'aplus_premium'
  | 'brand_store_banner'
  | 'brand_story'
  | 'store_tile'
  | 'video_cover'
  | 'social_post';

// 产品类别
export type ProductCategory =
  | 'birthday'
  | 'wedding'
  | 'babyshower'
  | 'holiday'
  | 'graduation'
  | 'other'
  | 'banner'
  | 'balloon'
  | 'tableware'
  | 'cake_topper'
  | 'favor_bag'
  | 'backdrop';

/**
 * 根据图片类型获取对应的设计知识
 * 只返回2-3段最相关的知识，避免Prompt过长
 */
export function getKnowledgeForImageType(imageType: ImageTypeId): string {
  const knowledgeSegments: string[] = [];

  switch (imageType) {
    case 'main':
      // 主图：主图规范 + 构图精要（角度/比例部分）
      knowledgeSegments.push(AMAZON_IMAGE_RULES.mainImage);
      knowledgeSegments.push(`
MAIN IMAGE COMPOSITION:
- Product fills 85%+ of frame, centered
- Slight angle (15-30°) to show depth
- Clean white background, no shadows bleeding onto it
- For sets: show all pieces, arrange neatly
`);
      break;

    case 'sellingPoint':
      // 卖点图：信息图规范 + 负空间指导
      knowledgeSegments.push(AMAZON_IMAGE_RULES.infographic);
      knowledgeSegments.push(`
INFOGRAPHIC COMPOSITION:
- Leave negative space for text callouts
- Max 3-4 key callouts per image
- Icons + short labels work better than paragraphs
- Mobile-first: large, readable text
`);
      break;

    case 'scene':
      // 场景图：生活方式规范 + 构图精简版 + 色彩精简版
      knowledgeSegments.push(AMAZON_IMAGE_RULES.lifestyleImage);
      knowledgeSegments.push(COMPOSITION_RULES_COMPACT);
      knowledgeSegments.push(COLOR_THEORY_COMPACT);
      break;

    case 'detail':
      // 细节图：特写构图 + 材质展示
      knowledgeSegments.push(`
DETAIL IMAGE RULES:
- Macro/close-up to show texture, material quality
- Sharp focus on key detail area
- Soft, even lighting to reveal surface details
- Show stitching, printing quality, material thickness
- Clean background, no distractions
`);
      break;

    case 'usage':
      // 使用图：生活方式 + 人物交互
      knowledgeSegments.push(AMAZON_IMAGE_RULES.lifestyleImage);
      knowledgeSegments.push(`
IN-USE IMAGE COMPOSITION:
- Show product being used naturally
- Include hands or partial body for human element
- Eye-level camera angle matching viewer perspective
- Capture the moment of joy/celebration
`);
      break;

    case 'handheld':
      // 手持图：比例参考 + 构图
      knowledgeSegments.push(`
HANDHELD IMAGE RULES:
- Product held naturally in hand
- Shows actual size/scale clearly
- Clean, uncluttered background
- Good lighting on both hand and product
- Multiple angles if applicable
`);
      knowledgeSegments.push(COMPOSITION_RULES_COMPACT);
      break;

    case 'aplus_standard':
    case 'aplus_premium':
      // A+ Content：A+规范
      knowledgeSegments.push(AMAZON_IMAGE_RULES.aPlusContent);
      knowledgeSegments.push(COMPOSITION_RULES_COMPACT);
      break;

    case 'brand_store_banner':
    case 'brand_story':
    case 'store_tile':
      // 品牌旗舰店：Banner规范 + 品牌一致性
      knowledgeSegments.push(AMAZON_IMAGE_RULES.storeBanner);
      knowledgeSegments.push(`
BRAND STORE COMPOSITION:
- Ultra-wide design for horizontal scanning
- Key message in center 60% for mobile
- Consistent brand visual language
- Lifestyle imagery that tells brand story
`);
      break;

    case 'video_cover':
      // 视频封面：封面规范
      knowledgeSegments.push(AMAZON_IMAGE_RULES.videoThumbnail);
      break;

    case 'social_post':
      // 社媒图：社媒规范 + 色彩
      knowledgeSegments.push(AMAZON_IMAGE_RULES.socialPost);
      knowledgeSegments.push(COLOR_THEORY_COMPACT);
      break;

    default:
      // 默认：基础构图 + 色彩
      knowledgeSegments.push(COMPOSITION_RULES_COMPACT);
      knowledgeSegments.push(COLOR_THEORY_COMPACT);
  }

  return knowledgeSegments.join('\n\n');
}

/**
 * 根据产品类别获取派对用品专用知识
 */
export function getKnowledgeForCategory(category: string): string {
  const lowerCategory = category.toLowerCase();

  // 根据类别关键词匹配对应的品类指南段落
  if (lowerCategory.includes('banner') || lowerCategory.includes('bunting') || lowerCategory.includes('横幅')) {
    return `
BANNER/BUNTING PHOTOGRAPHY:
- Show hanging at realistic height and angle
- Display full text/message readable
- Include close-up of material quality
- Lifestyle: hung across fireplace, table, or doorway
`;
  }

  if (lowerCategory.includes('balloon') || lowerCategory.includes('气球')) {
    return `
BALLOON PHOTOGRAPHY:
- Show inflated at correct proportions
- Include arch/garland arrangement
- Color accuracy is critical
- Include size reference (person or furniture)
`;
  }

  if (lowerCategory.includes('tableware') || lowerCategory.includes('plate') || lowerCategory.includes('cup') || lowerCategory.includes('餐具')) {
    return `
TABLEWARE PHOTOGRAPHY:
- Flat-lay of complete place setting
- Show plate + cup + napkin + utensils together
- Include count/quantity visual
- Lifestyle: set on decorated table
`;
  }

  if (lowerCategory.includes('cake') || lowerCategory.includes('topper') || lowerCategory.includes('蛋糕')) {
    return `
CAKE TOPPER PHOTOGRAPHY:
- Show on actual cake (lifestyle)
- Show standalone with scale reference
- Detail shot of finish quality
- Multiple angles: front, side
`;
  }

  if (lowerCategory.includes('favor') || lowerCategory.includes('bag') || lowerCategory.includes('box') || lowerCategory.includes('礼品袋')) {
    return `
FAVOR BAG PHOTOGRAPHY:
- Show empty + filled with sample contents
- Display printing/design details
- Show quantity in package
- Size reference with items inside
`;
  }

  if (lowerCategory.includes('backdrop') || lowerCategory.includes('prop') || lowerCategory.includes('背景')) {
    return `
BACKDROP PHOTOGRAPHY:
- Show full setup with scale reference
- Show someone posing (in-use)
- Detail of material quality
- Show mounting method
`;
  }

  // 默认返回通用派对用品指南精简版
  return `
PARTY SUPPLIES TIPS:
- Show COMPLETE set contents
- Number callout visible (e.g., "24-piece set")
- Color accuracy critical for party matching
- Cross-sell: show with complementary items
`;
}

/**
 * 根据节日/场合获取对应的色彩建议
 */
export function getColorGuideForOccasion(occasion: string): string {
  const lowerOccasion = occasion.toLowerCase();

  if (lowerOccasion.includes('christmas') || lowerOccasion.includes('圣诞')) {
    return 'Christmas colors: red+green+gold (classic) or blue+silver+white (modern)';
  }
  if (lowerOccasion.includes('halloween') || lowerOccasion.includes('万圣')) {
    return 'Halloween colors: orange+black+purple+green';
  }
  if (lowerOccasion.includes('valentine') || lowerOccasion.includes('情人')) {
    return "Valentine's colors: red+pink+white+gold";
  }
  if (lowerOccasion.includes('easter') || lowerOccasion.includes('复活')) {
    return 'Easter colors: pastel rainbow + white + gold';
  }
  if (lowerOccasion.includes('july') || lowerOccasion.includes('国庆') || lowerOccasion.includes('patriotic')) {
    return '4th of July colors: red+white+blue (strict patriotic)';
  }
  if (lowerOccasion.includes('thanksgiving') || lowerOccasion.includes('感恩')) {
    return 'Thanksgiving colors: orange+brown+gold+cream';
  }
  if (lowerOccasion.includes('baby') || lowerOccasion.includes('shower')) {
    return 'Baby Shower colors: pink OR blue OR sage green + white + gold';
  }
  if (lowerOccasion.includes('wedding') || lowerOccasion.includes('婚')) {
    return 'Wedding colors: white+gold/silver + one accent color';
  }
  if (lowerOccasion.includes('birthday') || lowerOccasion.includes('生日')) {
    return 'Birthday colors: match age group - pastels for kids, bold for teens, elegant for adults';
  }

  return '';
}

/**
 * 场景工作台专用：获取场景图生成的完整知识注入
 * 返回：场景图规范 + 构图精简版 + 色彩精简版 + 品类指南（如有）
 */
export function getSceneWorkbenchKnowledge(
  productCategory?: string,
  selectedTags?: string[]
): string {
  const segments: string[] = [];

  // 1. 场景图核心规范
  segments.push(AMAZON_IMAGE_RULES.lifestyleImage);

  // 2. 构图精简版
  segments.push(COMPOSITION_RULES_COMPACT);

  // 3. 色彩精简版
  segments.push(COLOR_THEORY_COMPACT);

  // 4. 根据产品类别添加品类指南
  if (productCategory) {
    const categoryGuide = getKnowledgeForCategory(productCategory);
    if (categoryGuide) {
      segments.push(categoryGuide);
    }
  }

  // 5. 根据选中的标签添加对应的色彩建议
  if (selectedTags && selectedTags.length > 0) {
    const occasionTags = selectedTags.filter(tag =>
      ['christmas', 'halloween', 'valentine', 'easter', 'july4th', 'thanksgiving', 'babyshower', 'wedding', 'birthday']
        .some(occ => tag.toLowerCase().includes(occ))
    );

    for (const tag of occasionTags) {
      const colorGuide = getColorGuideForOccasion(tag);
      if (colorGuide) {
        segments.push(`Color Guide: ${colorGuide}`);
        break; // 只添加一个，避免过长
      }
    }
  }

  return segments.join('\n\n');
}

/**
 * 批量生成Step3专用：根据图片类型获取知识注入
 */
export function getBatchGenerationKnowledge(
  imageType: ImageTypeId,
  productCategory?: string
): string {
  const segments: string[] = [];

  // 1. 图片类型对应的规范
  segments.push(getKnowledgeForImageType(imageType));

  // 2. 场景图和使用图需要品类指南
  if (['scene', 'usage', 'handheld'].includes(imageType) && productCategory) {
    const categoryGuide = getKnowledgeForCategory(productCategory);
    if (categoryGuide) {
      segments.push(categoryGuide);
    }
  }

  return segments.join('\n\n');
}
