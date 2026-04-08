# 产品图AI设计知识库
> 用途：嵌入批量生成（Step3 Prompt生成）和场景工作台（scenePromptGenerator）的系统Prompt中
> 更新：2026年4月

---

## 使用方式

在 Claude Code 中创建 `src/lib/designKnowledge.ts`，导出知识库文本常量。
在以下两处的系统Prompt中引用：
1. `Step3` Prompt生成时 → 根据图片类型注入对应规范
2. `scenePromptGenerator.ts` → 场景图生成时注入构图和色彩指导

---

## 知识库内容

### 一、亚马逊产品图规范

```typescript
export const AMAZON_IMAGE_RULES = {

  // ===== 主图规范 =====
  mainImage: `
AMAZON MAIN IMAGE RULES (STRICT):
- Pure white background RGB(255,255,255), no exceptions
- Product fills 85%+ of frame, centered with small margins
- NO text, logos, watermarks, badges, or promotional overlays
- NO props or accessories not included in purchase
- NO illustrations or mockups - must look like real product photography
- Show only what customer receives in the package
- If multi-piece set: show all pieces, no single piece enlarged
- Clean professional lighting, no harsh shadows on background
- Product must be fully visible, no cropping at edges
- Square format (1:1) preferred for consistent display
- Shoot at slight angle (15-30°) to show depth and dimension
- For party supplies: show the product flat-laid or standing, never in-use
`,

  // ===== 卖点图/信息图规范 =====
  infographic: `
AMAZON INFOGRAPHIC/FEATURE IMAGE RULES:
- Text and graphics ARE allowed on secondary images
- Keep text large and readable (mobile-first, 70%+ traffic is mobile)
- Max 3-4 key callouts per image, avoid cluttered layouts
- Use icons + short text labels, not paragraphs
- Show product dimensions with clear size reference
- Highlight unique selling points: material, quantity, included items
- Use contrast colors for text against background
- Include "what's in the box" image showing all components
- Comparison charts work well (us vs competitors, without naming them)
- Feature close-up details: texture, stitching, material quality
`,

  // ===== 场景图/生活方式图规范 =====
  lifestyleImage: `
AMAZON LIFESTYLE IMAGE RULES:
- Show product in realistic use context
- Target audience should see themselves using the product
- Natural, warm lighting preferred (not overly stylized)
- Environment should match product category:
  * Party decorations → decorated room/table/outdoor space
  * Kids items → child-friendly, bright, safe-looking environment
  * Holiday items → appropriate seasonal setting
- Include human elements when relevant (hands, partial body)
- Props should complement, not overshadow the product
- Show scale reference naturally (hands, furniture, room context)
- Emotional storytelling: capture the joy/celebration/moment
- Multiple products from same line shown together builds cross-sell
`,

  // ===== A+ Content 图规范 =====
  aPlusContent: `
A+ CONTENT IMAGE RULES:
- Standard A+: modules at 970×600px or 300×300px
- Premium A+: full-width at 1464×600px
- Brand Story: 1464×625px banner
- Use consistent brand visual language across all modules
- Hero banner: single powerful image + minimal text overlay
- Comparison modules: clean grid, consistent cell styling
- Feature modules: icon + short description pairs
- Lifestyle banner: aspirational scene with product naturally placed
- Keep text embedded in image minimal (Amazon prefers text in CMS fields)
`,

  // ===== 品牌旗舰店 Banner =====
  storeBanner: `
BRAND STORE BANNER RULES:
- Hero banner: 3000×600px (desktop) / 1500×600px (mobile)
- Product tile: 800×800px or 1500×750px
- Ultra-wide aspect ratio (5:1) - design for horizontal scanning
- Brand name/logo can appear but should not dominate
- Use lifestyle imagery that tells brand story
- Seasonal banners should feel fresh and timely
- Mobile: ensure key message visible in center 60% of frame
`,

  // ===== 视频封面图 =====
  videoThumbnail: `
VIDEO THUMBNAIL RULES:
- 16:9 aspect ratio (1920×1080)
- Must clearly show the product
- Include play button visual hint
- High contrast, eye-catching composition
- Text overlay allowed but keep minimal
- Should make viewer want to click and watch
`,

  // ===== 社媒/帖子图 =====
  socialPost: `
SOCIAL MEDIA / AMAZON POST RULES:
- Square 1:1 (1200×1200) or landscape 1200×628
- More creative freedom than listing images
- Lifestyle-forward, editorial feel
- Can include styled scenes, flat lays, in-use shots
- Text overlays allowed but keep brand-consistent
- Seasonal/trending themes increase engagement
- User-generated content style performs well
`,

  // ===== 尺寸速查表 =====
  sizeReference: `
IMAGE SIZE QUICK REFERENCE:
- Main image: 2000×2000px (1:1, minimum 1000px for zoom)
- Secondary images: 2000×2000px (1:1 recommended)
- Standard A+: 970×600px
- Premium A+: 1464×600px
- Brand Story: 1464×625px
- Store Banner: 3000×600px
- Store Tile: 800×800px
- Video Thumbnail: 1920×1080px (16:9)
- Social Post: 1200×1200px (1:1)
- File formats: JPEG preferred, also PNG/TIFF/GIF
- Color space: sRGB (not Adobe RGB)
- Max file size: 10MB
`
};
```

### 二、构图法则

```typescript
export const COMPOSITION_RULES = `
PROFESSIONAL PRODUCT PHOTOGRAPHY COMPOSITION GUIDE:

【Rule of Thirds】
- Place product at intersection points of a 3×3 grid
- For single product: slightly off-center creates visual interest
- For multiple items: use grid lines to create balanced arrangement
- Leave breathing room around edges (5-10% margin)

【Leading Lines】
- Use table edges, fabric folds, or prop arrangement to guide eye to product
- Diagonal lines create energy and movement
- Converging lines create depth
- For party scenes: bunting, garlands, and streamers naturally create leading lines

【Depth and Layering】
- Use foreground, midground, background layers
- Product in sharp focus (midground), background slightly blurred (f/2.8-4.0 bokeh)
- Props in foreground create immersion and depth
- For party setups: balloons in front, product center, backdrop behind

【Negative Space】
- Main image: generous white space around product
- Infographics: leave space for text callouts
- Lifestyle: don't overcrowd the scene
- Mobile-first: simple compositions read better on small screens

【Symmetry vs Asymmetry】
- Symmetrical: formal, elegant, premium feel (luxury party items)
- Asymmetrical: dynamic, fun, energetic (kids party items)
- Radial symmetry works well for circular arrangements (plate settings, wreath)

【Color Contrast for Visibility】
- Product should contrast with background
- Dark product → light/white background
- Light/white product → add subtle shadow or colored accent
- Use complementary color props to make product pop

【Scale and Proportion】
- Include scale reference (hand, common object) in at least one image
- For small items: macro/close-up to show detail
- For large items: show in room context
- For sets: show one piece large + group arrangement

【Camera Angles for Product Types】
- Flat items (banners, plates): 45° overhead or direct top-down
- 3D items (figurines, centerpieces): eye-level or slightly above
- Tall items (balloon columns, cake stands): slight low angle for grandeur
- Sets/collections: overhead flat-lay arrangement
- In-use shots: eye-level matching viewer perspective

【Mobile-Optimized Composition】
- 70%+ Amazon traffic is mobile - design for small screens
- Product should be recognizable at thumbnail size (160-200px)
- Simple, clean compositions with strong contrast
- Avoid tiny details that disappear on mobile
- Test by viewing image at 200px - is product still clear?
`;
```

### 三、色彩理论

```typescript
export const COLOR_THEORY = `
COLOR THEORY FOR PRODUCT PHOTOGRAPHY:

【Color Wheel Basics for Scene Styling】
- Complementary colors (opposite on wheel) create maximum contrast:
  Red↔Green, Blue↔Orange, Yellow↔Purple
- Analogous colors (adjacent) create harmony:
  Blue+Teal+Green, Red+Orange+Yellow
- Triadic colors create vibrant balance:
  Red+Yellow+Blue, Orange+Green+Purple

【Seasonal Color Palettes (Party Decorations)】
- Spring: pastels - soft pink, lavender, mint green, baby blue, cream
- Summer: vibrant - coral, turquoise, sunny yellow, hot pink, lime
- Autumn/Fall: warm - burnt orange, burgundy, olive, mustard, brown
- Winter: rich - deep red, emerald, gold, silver, navy, white

【Holiday-Specific Color Rules】
- Christmas: red+green+gold (classic) or blue+silver+white (modern)
- Halloween: orange+black+purple+green
- Valentine's: red+pink+white+gold
- Easter: pastel rainbow + white + gold
- 4th of July: red+white+blue (strict patriotic)
- Thanksgiving: orange+brown+gold+cream
- Baby Shower: pink OR blue OR sage green + white + gold (gender neutral trend)
- Wedding: white+gold/silver + one accent color

【Color Psychology in Product Photography】
- Red: excitement, urgency, celebration, passion
- Blue: trust, calm, reliability, professionalism
- Green: nature, freshness, health, growth
- Yellow: happiness, optimism, warmth, attention
- Pink: femininity, sweetness, romance, tenderness
- Purple: luxury, creativity, mystery, royalty
- Orange: energy, fun, friendliness, enthusiasm
- Black: elegance, sophistication, power, premium
- White: purity, cleanliness, simplicity, space
- Gold: luxury, celebration, premium, achievement

【Background Color Strategy】
- Main image: MUST be pure white RGB(255,255,255)
- Lifestyle images: match scene context naturally
- Infographics: light neutral backgrounds (white, light gray, cream)
- A+ Content: brand-consistent palette
- Dark backgrounds: use for premium/luxury positioning
- Colored backgrounds: ensure product has enough contrast

【Color Consistency Across Listing】
- Use consistent color palette across all 7-9 images
- Match product colors accurately (sRGB color space)
- Maintain consistent white balance across images
- Brand colors should appear consistently but subtly
- Seasonal themed listings: carry color theme throughout

【Trending Party Colors 2026】
- Glacier Blue / Cool Blue (Pantone influence)
- Sage Green + Cream (neutral modern)
- Black + Gold (milestone celebrations)
- Amalfi Blue + Lemon Yellow (coastal trend)
- Mocha Brown + Cream (warm neutral)
- Neon / Glow colors (Gen Z events)
- Cherry Red (emerging accent)
- Rose Gold + Blush (sustained wedding/baby trend)
`;
```

### 四、派对用品品类专用指南

```typescript
export const PARTY_CATEGORY_GUIDE = `
PARTY SUPPLIES SPECIFIC PHOTOGRAPHY GUIDE:

【Banner/Bunting Photography】
- Show hanging at realistic height and angle
- Display full text/message readable
- Include close-up of material quality/printing
- Show multiple length configurations if adjustable
- Lifestyle: hung across fireplace, table, or doorway

【Balloon Sets Photography】
- Show inflated at correct proportions
- Include balloon arch/garland arrangement
- Show individual balloon types + full arrangement
- Color accuracy is critical (customers expect exact match)
- Include size reference (person or furniture nearby)

【Tableware Sets Photography】
- Flat-lay of complete place setting
- Show plate + cup + napkin + utensils together
- Include count/quantity visual
- Lifestyle: set on decorated table with complementary decor
- Show front and back of printed items

【Cake Toppers/Centerpieces Photography】
- Show on actual cake or table (lifestyle)
- Show standalone with scale reference
- Detail shot of material/finish quality
- Multiple angles: front, side, back
- Show assembled and packaging

【Party Favor Bags/Boxes Photography】
- Show empty + filled with sample contents
- Display printing/design details
- Show quantity (how many in package)
- Lifestyle: arranged on party table
- Size reference with common items inside

【Backdrop/Photo Booth Props Photography】
- Show full backdrop setup with scale reference
- Show someone posing with props (in-use)
- Detail shot of material (fabric vs vinyl vs paper)
- Show fold/wrinkle resistance
- Include mounting/hanging method visible

【General Party Supplies Tips】
- Always show the COMPLETE set contents
- Number callout (e.g., "24-piece set" visible)
- Show color accuracy (customers are picky about party color matching)
- Seasonal variants: same product, different seasonal styling
- Cross-sell opportunity: show product with other items from your line
- Gift-ability: show packaged version for gift-giving context
`;
```

---

## 嵌入策略

### 批量生成（Step3）
根据正在生成的图片类型，注入对应规范段：
- 主图 → `mainImage` + `COMPOSITION_RULES` (scale/angle部分)
- 卖点图 → `infographic` + `COMPOSITION_RULES` (negative space部分)
- 场景图 → `lifestyleImage` + `COLOR_THEORY` (seasonal部分) + `PARTY_CATEGORY_GUIDE`
- A+图 → `aPlusContent`
- Banner → `storeBanner`
- 视频封面 → `videoThumbnail`
- 社媒图 → `socialPost`

### 场景工作台
注入以下组合：
- `lifestyleImage` (场景图核心规范)
- `COMPOSITION_RULES` (完整构图指导)
- `COLOR_THEORY` (根据选中的色彩标签匹配对应段)
- `PARTY_CATEGORY_GUIDE` (根据产品类别匹配对应段)

### 注入方式
不要一次性注入全部内容（太长会影响Prompt质量）。
按需注入：根据当前生成的图片类型和产品类别，只拼接相关的2-3段知识。

---

*知识库 v1.0 — 2026年4月8日*
