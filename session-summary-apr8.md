# 会话总结 — 场景工作台开发全记录
> 会话时间：2026年4月4日-8日 | 项目：产品图AI生成工具

---

## 一、本次会话完成的所有任务

### 1. 场景工作台（从零到完成）
- **Phase 1：** 顶部Tab切换（批量生成/场景工作台）+ 三栏布局骨架 + 产品图上传
- **Phase 2：** 场景标签选择器 + 三种提示词模式（自动/手动/混合）+ 高级选项面板
- **Phase 3：** 图片生成接入（图生图+文生图）+ Gemini视觉分析 + Prompt强化
- **Phase 4：** 历史记录 + 下载功能

### 2. 场景工作台优化
- ✅ 替换到主流程（场景图替换Step5中的图片，弹窗选择）
- ✅ 费用预估（百炼显示免费，OpenRouter显示$价格×数量）
- ✅ 移动端适配（<768px垂直堆叠，标签横滚，生成按钮sticky）
- ✅ 生成数量选择（1-4张）
- ✅ 保存路径自选（SavePathSelector共用组件，localStorage记住路径）
- ✅ Tab切换不丢数据（改为display:none/block而非条件渲染）
- ✅ 模型选择器样式优化（选中高亮绿/橙色）

### 3. 场景标签体系
- 从内部调研（291个派对主题）提炼初始标签
- 从Amazon/Etsy/Pinterest市场调研补充趋势标签
- 最终：**9大分类 207+个标签**
  - 节日/场合(45) | 派对元素/图案(30) | 目标人群(10)
  - 色彩主题(27) | 环境/场景(28) | 季节(8)
  - 风格(31) | 光影效果(12) | 摆放/构图(16)
- 标签UI：搜索框（中英文）+ 分类折叠/展开 + 已选绿点提示

### 4. Bug修复
- Gemini模型名更新（2.0-flash-exp:free → 2.5-flash）
- Gemini失败fallback：用产品名称拼接Prompt而非泛泛的"product item"
- 图生图URL错误修复（DashScope需公网URL）
- 产品一致性Prompt强化（[PRODUCT-DO NOT MODIFY] + negative prompt）
- Step1"下一步"按钮丢失修复
- 重新生成提示词按钮无反应修复

### 5. 设计知识库（已出文档，正在实施）
- `design-knowledge-base.md` 已创建，包含4大模块：
  - 亚马逊产品图规范（主图/卖点图/场景图/A+/Banner/社媒）
  - 构图法则（三分法/引导线/景深/负空间/相机角度）
  - 色彩理论（色轮/季节色板/节日配色/2026趋势色）
  - 派对品类专用指南（横幅/气球/餐具/蛋糕装饰等）
- **实施状态：已发给Claude Code执行，需要在新会话中确认完成情况**

### 6. 文档输出
- `scene-tab-spec.md` — 场景工作台实现规划
- `scene-tags-expanded.md` — 标签扩展数据（内部调研）
- `scene-tags-market-research.md` — 标签市场调研（Amazon/Etsy/Pinterest）
- `design-knowledge-base.md` — 设计知识库
- `project-summary-v3.md` — 项目总结文档v3

---

## 二、当前项目状态

### 已完成功能
| 模块 | 状态 | 说明 |
|------|------|------|
| 批量生成 Step1-5 | ✅ 完成 | 全流程可用 |
| 场景工作台 | ✅ 完成 | 三栏布局+图生图+标签+历史+下载 |
| 双平台支持 | ✅ 完成 | 百炼免费+OpenRouter付费 |
| 保存路径自选 | ✅ 完成 | 两个模式共用SavePathSelector |
| 场景标签体系 | ✅ 完成 | 9分类207+标签+搜索+折叠 |
| 移动端适配 | ✅ 完成 | 场景工作台响应式 |

### 正在进行
| 任务 | 状态 | 说明 |
|------|------|------|
| 设计知识库嵌入 | 🔄 进行中 | Claude Code正在执行，需确认完成 |

### 待做清单
| 优先级 | 任务 | 说明 |
|--------|------|------|
| 高 | 确认设计知识库实施 | 检查designKnowledge.ts是否创建，Prompt是否注入 |
| 高 | 确认标签数量未被误改 | `grep -c "{ id:" src/lib/scene/sceneTags.ts` 应≥207 |
| 中 | 部署到Zeabur | 让团队可以使用 |
| 中 | 接入更多图片模型 | 可灵AI、即梦AI |
| 低 | 多模型并发对比 | 同一Prompt多模型出图 |
| 低 | img2img/inpainting | 真正的背景替换能力 |

---

## 三、关键技术细节（新会话需知）

### 项目基本信息
- 路径：`C:\projects\product-image-ai`
- 框架：Next.js 14 + TypeScript + Tailwind CSS
- 主题：深色（背景#111827，强调绿#22c55e）
- 端口：http://localhost:3010（可能变化）
- 启动：需先开V2RayN代理 → `set HTTP_PROXY=http://127.0.0.1:10809` → `npm run dev`

### API配置
- **DashScope：** sk-1****8c45（百炼免费，文字qwen-plus，图片wanx2.1-t2i-turbo，图生图wanx2.6-image）
- **OpenRouter：** sk-or-v1-2f1e...（付费，FLUX图片，Gemini视觉分析用gemini-2.5-flash）
- **并发：** 百炼并发2+1.5秒间隔，OpenRouter并发5

### 场景工作台核心文件
```
src/components/scene/
├── SceneWorkbench.tsx        # 主容器
├── SceneProductUpload.tsx     # 左栏
├── ScenePromptEditor.tsx      # 中栏
├── ScenePreview.tsx           # 右栏
├── SceneTagSelector.tsx       # 标签选择器
├── SceneHistory.tsx           # 历史记录
└── SceneModelSelector.tsx     # 模型选择

src/lib/scene/
├── sceneTags.ts              # 207+标签数据
├── scenePromptGenerator.ts    # Prompt生成
└── geminiVision.ts           # Gemini视觉分析

src/lib/
├── designKnowledge.ts        # 设计知识库（正在创建）
├── designKnowledgeSelector.ts # 知识库按需选择器（正在创建）
└── SavePathSelector.tsx       # 共用保存路径组件（在components/下）
```

### 图生图流程
1. 用户上传产品图 + 选场景标签
2. Gemini 2.5 Flash 分析产品外观 → 输出"产品外观锁定描述"
3. 拼接Prompt：[PRODUCT-DO NOT MODIFY] + [SCENE ONLY] + negative prompt
4. DashScope wanx2.6-image 图生图API生成（需公网URL或base64）
5. 失败时fallback到文生图（用产品名称+标签）

---

## 四、新会话开始指令

```
读取项目根目录的 project-summary-v3.md 了解项目全貌。

然后检查以下事项：
1. src/lib/designKnowledge.ts 是否已创建？如果没有，读取根目录的 design-knowledge-base.md 按要求实施
2. grep -c "{ id:" src/lib/scene/sceneTags.ts — 标签数量是否≥207？
3. 编译是否正常？运行 npx tsc --noEmit 检查

报告检查结果后，等我指示下一步任务。
```

---

*总结于2026年4月8日*
