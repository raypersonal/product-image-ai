# 场景图工作台 — 实现规划 v1.0

> 项目路径：`C:\projects\product-image-ai`
> 基于：Next.js 14 + Tailwind CSS 深色主题（背景#111827，强调绿#22c55e）

---

## 一、入口设计：顶部导航Tab

在页面顶部加一个模式切换器，两个Tab：

```
[ 📦 批量生成 ]  [ 🎨 场景工作台 ]
```

- 「批量生成」= 当前的 Step1-5 主流程（默认激活）
- 「场景工作台」= 新的独立场景图生成工具
- 切换时各自保持状态不丢失（用 state 隔离，非路由跳转）
- Tab 样式：未选中灰色底 + 选中绿色下划线/高亮

### 实现方式
在 `app/page.tsx`（或主布局组件）顶层加一个 `activeMode` state：
```tsx
const [activeMode, setActiveMode] = useState<'batch' | 'scene'>('batch');
```
根据 activeMode 条件渲染两套内容，场景工作台整体封装为 `<SceneWorkbench />` 组件。

---

## 二、场景工作台三栏布局

```
┌─────────────────────────────────────────────────────────────────┐
│  🎨 场景工作台                                    [模型选择 ▼]  │
├──────────────┬──────────────────────┬────────────────────────────┤
│   产品图上传   │    提示词编辑区       │     预览 & 生成结果         │
│              │                      │                            │
│  [拖拽上传区]  │  模式: ⚡自动 ✏手动 🔀混合 │  [生成按钮]               │
│              │                      │                            │
│  已上传图片    │  场景快捷标签:         │  生成中: 进度条              │
│  ┌────┐      │  🎂生日  🏕户外       │                            │
│  │ 图1 │      │  🏠家庭  🎄节日       │  ┌──────────────────┐      │
│  └────┘      │  ⬜白底  🎉派对       │  │                  │      │
│  ┌────┐      │  🏖海滩  🌸春天       │  │   生成的图片       │      │
│  │ 图2 │      │  🎃万圣节 🎅圣诞      │  │                  │      │
│  └────┘      │  💝情人节 🇺🇸国庆      │  │                  │      │
│              │                      │  └──────────────────┘      │
│  ──────────  │  提示词文本框:         │                            │
│  产品信息(可选) │  (自动填充/手动编辑)   │  历史记录区:                 │
│  产品名:___   │                      │  ┌────┐ ┌────┐ ┌────┐     │
│  类别:___     │  高级选项 ▼            │  │ h1 │ │ h2 │ │ h3 │     │
│              │  尺寸: [1024×1024 ▼]  │  └────┘ └────┘ └────┘     │
│              │  风格强度: ━━━●━━      │  [替换到主流程] [下载]       │
│              │  参考图权重: ━━●━━━    │                            │
└──────────────┴──────────────────────┴────────────────────────────┘
```

### 栏宽比例
- 左栏（产品图）：25% — `w-1/4`
- 中栏（提示词）：35% — `w-[35%]`
- 右栏（预览）：40% — `w-[40%]`
- 移动端：垂直堆叠

---

## 三、各栏详细功能

### 左栏：产品图上传

**组件：** `SceneProductUpload.tsx`

1. **拖拽上传区**
   - 复用主流程 Step1 的上传逻辑
   - 最多6张产品图
   - 自动压缩超2MB图片（同主流程）
   - 支持 jpg/png/webp

2. **已上传图片预览**
   - 缩略图网格（2列）
   - 点击放大查看
   - 删除按钮
   - 第一张标记为"主参考图"（Gemini图+文输入时使用）

3. **产品信息（可选）**
   - 产品名称（文本输入）
   - 产品类别（文本输入）
   - 简短描述（文本域，非必填）
   - 这些信息辅助自动生成更精准的场景Prompt

---

### 中栏：提示词编辑区

**组件：** `ScenePromptEditor.tsx`

#### 三种模式切换

**⚡ 自动模式（默认）：**
- 用户选场景标签 → 系统自动生成完整Prompt
- Prompt生成调用文字模型（百炼qwen-plus / OpenRouter DeepSeek）
- 自动模式下文本框只读，显示生成结果
- 用户可点"重新生成"换一个

**✏ 手动模式：**
- 文本框完全可编辑
- 用户自由写Prompt
- 场景标签点击后插入关键词到文本框（而非替换）

**🔀 混合模式：**
- 先选标签自动生成 → 然后文本框可编辑微调
- 最实用的模式

#### 场景快捷标签

按场景分类，可多选（组合场景）：

```typescript
const SCENE_TAGS = {
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
```

标签UI：胶囊按钮，选中高亮绿色，可多选组合。

#### 高级选项（折叠面板）
- **输出尺寸：** 下拉选择（1:1 / 4:3 / 3:4 / 16:9 / 9:16 / 21:9）
- **风格强度滑块：** 0-100，控制场景氛围浓度（映射到Prompt措辞强弱）
- **参考图权重滑块：** 0-100，Gemini模式下控制保留产品外观的程度（映射到Prompt指令）

---

### 右栏：预览 & 生成结果

**组件：** `ScenePreview.tsx`

1. **生成按钮**
   - 大号绿色按钮："🎨 生成场景图"
   - 生成中显示进度动画 + "生成中..."
   - 按钮下方显示预估费用（百炼:免费 / OpenRouter:$X.XX）

2. **当前生成结果**
   - 大图预览区（占右栏主体）
   - 图片加载中显示骨架屏
   - 图片下方操作栏：
     - 🔄 重新生成（同参数再来一张）
     - 📥 下载
     - ✅ 替换到主流程（弹窗选择替换Step5中哪张图）

3. **历史记录区**
   - 本次会话生成的所有图片缩略图列表
   - 点击切换预览
   - 最多保留20张（内存考虑）
   - 每张图记录：图片数据 + 使用的Prompt + 模型 + 场景标签

---

## 四、模型接入方案

### 顶部模型选择器（右上角）

```
图片模型: [ 百炼🆓 Wanx 2.1 Turbo ▼ ]    [💰 OpenRouter FLUX ▼ ]
```

两个独立下拉，选其中一个平台：
- **百炼🆓：** wanx2.1-t2i-turbo / wanx2.1-t2i-plus / wanx-v1
- **OpenRouter💰：** FLUX.2 Klein / Flex / Pro

### Gemini 图+文模式（核心差异化功能）

当用户上传了产品图时，自动启用 Gemini 图+文能力：

**调用方式：** 通过 OpenRouter 调用 Gemini 模型
- 模型：`google/gemini-2.0-flash-exp:free` 或 `google/gemini-pro-vision`
- 发送：产品参考图（base64）+ 场景描述Prompt
- 作用：AI理解产品外观 → 生成「保持产品外观+换场景」的详细图片Prompt
- 生成的Prompt再发给图片模型（Wanx/FLUX）出图

**Prompt模板（Gemini图+文分析）：**
```
You are an expert product photographer. I'm showing you a product image.

Product: {productName}
Target scene: {selectedSceneTags}
Style: {selectedStyleTags}

Analyze the product's appearance (shape, color, texture, material, size) in detail, then write a professional product photography prompt that:
1. Preserves the product's exact appearance
2. Places it naturally in the described scene
3. Uses professional lighting and composition
4. Is optimized for AI image generation

Output the prompt in English, 150-200 words, focusing on visual details.
```

**流程：**
1. 用户上传产品图 + 选场景标签
2. → Gemini分析产品图 + 结合场景生成详细Prompt
3. → Prompt显示在中栏文本框（用户可微调）
4. → 点"生成" → 图片模型（Wanx/FLUX）出图
5. → 右栏显示结果

---

## 五、新增文件清单

```
src/
├── components/
│   └── scene/
│       ├── SceneWorkbench.tsx        # 场景工作台主容器（三栏布局）
│       ├── SceneProductUpload.tsx     # 左栏：产品图上传
│       ├── ScenePromptEditor.tsx      # 中栏：提示词编辑 + 场景标签
│       ├── ScenePreview.tsx           # 右栏：预览 & 生成结果
│       ├── SceneTagSelector.tsx       # 场景快捷标签选择器
│       ├── SceneHistory.tsx           # 历史记录缩略图列表
│       └── SceneModelSelector.tsx     # 模型选择器（顶部）
├── lib/
│   └── scene/
│       ├── scenePromptGenerator.ts    # 场景Prompt生成逻辑
│       ├── sceneTags.ts              # 场景标签数据定义
│       └── geminiVision.ts           # Gemini图+文分析封装
└── app/
    └── api/
        └── scene/
            ├── analyze/route.ts       # Gemini图+文分析API
            └── generate/route.ts      # 场景图生成API（可复用主流程）
```

### 需修改的现有文件
- `app/page.tsx` — 加顶部Tab切换 + 引入 SceneWorkbench
- `components/ImageGallery.tsx`（Step5）— 加"来自场景工作台"的图片接收逻辑

---

## 六、State 设计

```typescript
interface SceneState {
  // 产品图
  productImages: UploadedImage[];     // 上传的产品图（base64）
  productInfo: {
    name: string;
    category: string;
    description: string;
  };

  // 场景选择
  selectedTags: string[];             // 选中的场景标签ID
  promptMode: 'auto' | 'manual' | 'hybrid';
  prompt: string;                     // 当前Prompt文本
  isPromptEdited: boolean;            // 混合模式下是否手动编辑过

  // 生成配置
  platform: 'dashscope' | 'openrouter';
  imageModel: string;                 // 具体模型ID
  outputSize: string;                 // 输出尺寸
  styleStrength: number;              // 风格强度 0-100
  referenceWeight: number;            // 参考图权重 0-100

  // 生成状态
  isAnalyzing: boolean;               // Gemini分析中
  isGenerating: boolean;              // 图片生成中
  currentImage: GeneratedImage | null;
  history: GeneratedImage[];          // 历史记录（最多20张）
}

interface GeneratedImage {
  id: string;
  imageData: string;                  // base64 或 URL
  prompt: string;
  model: string;
  tags: string[];
  timestamp: number;
  size: string;
}
```

---

## 七、开发顺序（建议4个阶段）

### Phase 1：骨架 + 左栏
1. `app/page.tsx` 加顶部Tab切换（批量生成 / 场景工作台）
2. `SceneWorkbench.tsx` 三栏布局骨架
3. `SceneProductUpload.tsx` 产品图上传（复用主流程上传组件逻辑）
4. `sceneTags.ts` 场景标签数据

### Phase 2：中栏提示词
5. `SceneTagSelector.tsx` 标签选择UI
6. `ScenePromptEditor.tsx` 三种模式切换 + 文本框
7. `scenePromptGenerator.ts` 自动Prompt生成（调百炼/OpenRouter文字模型）
8. 高级选项面板（尺寸/滑块）

### Phase 3：右栏生成
9. `SceneModelSelector.tsx` 模型选择器
10. `geminiVision.ts` + `api/scene/analyze/route.ts` — Gemini图+文分析
11. `api/scene/generate/route.ts` — 图片生成API（复用主流程生成逻辑）
12. `ScenePreview.tsx` 生成结果显示 + 下载

### Phase 4：联动 + 收尾
13. `SceneHistory.tsx` 历史记录
14. "替换到主流程"功能（场景工作台 → Step5）
15. 移动端响应式适配
16. 费用预估显示

---

## 八、Claude Code 操作指令

```bash
# 开始前备份
cd C:\projects\product-image-ai
git add -A && git commit -m "v1.3-stable: 开始场景工作台开发前备份"

# Phase 1 开始
# 告诉 Claude Code:
# "读取 scene-tab-spec.md，按 Phase 1 开发。
#  先改 app/page.tsx 加顶部Tab切换，
#  然后创建 src/components/scene/ 目录，
#  依次实现 SceneWorkbench.tsx 和 SceneProductUpload.tsx。
#  复用主流程的上传逻辑和深色主题样式。"

# 每个Phase完成后提交
git add -A && git commit -m "scene-tab: Phase 1 完成 - 骨架+左栏"
```

---

*规划文档 v1.0 — 2026年4月4日*
