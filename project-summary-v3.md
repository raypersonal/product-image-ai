# 产品图AI生成工具 — 项目总结文档 v3
> 更新时间：2026年4月8日 | 项目路径：`C:\projects\product-image-ai`

---

## 一、项目概况

基于 Next.js 14 + Tailwind CSS 深色主题的跨境电商产品图AI批量生成工具。覆盖从产品信息输入到图片下载的完整流程，支持阿里云百炼（免费）和 OpenRouter（付费）双平台。**v2.0 新增独立"场景工作台"Tab，支持图生图保持产品一致性。**

**技术栈：** Next.js 14 App Router + TypeScript + Tailwind CSS（深色主题，背景#111827，强调绿#22c55e）
**项目路径：** `C:\projects\product-image-ai`
**Git版本管理：** 已启用，主分支 master

---

## 二、双模式架构

### 模式A：批量生成（Step 1-5）
完整的5步流程，从产品信息输入到批量图片生成下载。适合一次性生成全套亚马逊产品图。

### 模式B：场景工作台（独立Tab）
三栏布局的单张精细场景图生成工具。上传产品实拍 → 选场景/风格标签 → AI生成场景图。支持图生图模式保持产品外观一致。

顶部Tab切换，两个模式各自保持状态不丢失。

---

## 三、批量生成（Step 1-5）详情

### Step 1：产品信息输入 ✅
- Tab A：手动填写（产品名称/类别/描述/卖点/人群/风格）
- Tab B：从飞书多维表格读取（输入appToken + tableId）
- 参考图片上传区（可选，最多6张，支持拖拽，自动压缩超2MB图片）
- 产品描述最少50字校验

### Step 2：AI产品分析 ✅
- 模型选择下拉菜单（百炼免费 / OpenRouter付费）
- 分析模型：通义千问-Plus（默认免费）/ 千问-Max / DeepSeek / GPT-4o
- 视觉分析：qwen-vl-plus（有参考图时自动用Vision模型分析图片）
- 输出：视觉风格 / 色彩方向 / 目标人群 / 差异化卖点 / 建议场景

### Step 3：生成图片Prompt ✅
- Prompt生成模型选择（百炼免费 / OpenRouter付费）
- 图片类型选择区：
  - 基础图片类型（默认勾选）：主图×6 / 卖点图×7 / 场景图×7 / 细节图×2 / 使用图×2 / 手持图×2
  - 附加图片类型（默认不勾选）：标准A+图×3 / 高级A+图×3 / 品牌旗舰店Banner×2 / 品牌故事图×2 / 旗舰店商品瓷砖×2 / 视频封面图×1 / 社媒帖子图×2
- 每个类型独立尺寸选择，快捷按钮（全选/全不选/仅基础图）
- 每条Prompt可手动编辑、单条重新生成

### Step 4：生成图片 ✅
- 百炼🆓：Wanx 2.1 Turbo / Plus / V1
- OpenRouter💰：FLUX.2 Klein / Flex / Pro
- 费用预估实时显示，并发控制（百炼并发2+1.5秒间隔，OpenRouter并发5）
- 进度条、重新生成、重试按钮

### Step 5：查看 & 下载 ✅
- 图片按类型分组网格显示，悬停显示下载按钮
- 全部下载（ZIP）
- **保存到本地（用户自选路径）** → 保存到 {用户路径}/{产品名}_{时间}/ 文件夹
- 保存路径通过 SavePathSelector 组件选择，localStorage 记住上次路径

---

## 四、场景工作台详情（v2.0 新增）

### 整体架构
- **入口：** 顶部导航Tab，与"批量生成"并列
- **布局：** 三栏（左25% 产品图 | 中35% 提示词 | 右40% 预览生成）
- **核心能力：** 图生图（上传产品图时）+ 文生图（无产品图时）

### 左栏：产品图上传
- 拖拽上传区，最多6张，自动压缩超2MB
- 第一张标记为"主参考图"
- 产品信息（可选）：名称、类别、简短描述

### 中栏：提示词编辑
- **三种模式切换：** ⚡自动（标签生成Prompt）| ✏手动（自由编辑）| 🔀混合（自动+微调）
- **场景快捷标签系统（116个标签，7大分类）：**
  - 节日/场合（20个）：生日、婚礼、万圣节、圣诞、感恩节、母亲节等
  - 色彩主题（20个）：金色、玫瑰金、马卡龙色、霓虹色、冰川蓝、摩卡棕等
  - 环境/场景（20个）：户外、家庭、客厅、厨房、咖啡厅、森林、阿马尔菲海岸等
  - 季节（8个）：春夏秋冬、热带、雨天、雪景等
  - 风格（20个）：极简、奢华、复古、波西米亚、北欧、Neo Art Deco、Afrohemian等
  - 光影效果（12个）：自然光、黄金时刻、柔光、烛光、星星灯等
  - 摆放/构图（16个）：平铺、生活场景、特写、悬浮、手持等
- **标签UI功能：**
  - 默认只展开"节日/场合"和"色彩主题"，其他折叠
  - 分类标题可点击展开/折叠，显示已选数量
  - 折叠时有已选标签显示绿色小圆点提示
  - 顶部搜索框，支持中英文实时筛选
  - 折叠动画（max-height + transition）
- **高级选项（折叠面板）：** 输出尺寸、风格强度滑块、参考图权重滑块
- "重新生成提示词"按钮

### 右栏：预览 & 生成
- **模型选择器（右上角）：** 百炼🆓 / OpenRouter💰，与主流程相同模型列表
- **生成数量选择：** 1-4张，横排按钮选择
- **生成场景图按钮 + 进度动画**
- **图生图模式：** 上传产品图时自动启用
  - Gemini 分析产品图外观 → 生成精确描述
  - Prompt 结构强化：[PRODUCT - DO NOT MODIFY] + [SCENE ONLY]
  - DashScope 图生图 API（wanx2.6-image）保持产品一致性
  - Negative prompt 防止产品变形
- **文生图模式：** 无产品图时使用产品名称+标签生成
- 历史记录：本次会话所有生成图片缩略图，最多20张
- 单张下载按钮
- **保存到本地（用户自选路径）：** 与批量生成共用 SavePathSelector 组件

### 场景工作台 Gemini 视觉分析
- 模型：通过 OpenRouter 调用 `google/gemini-2.5-flash`（备选 `gemini-2.0-flash-001`）
- 作用：分析产品图外观（形状、颜色、材质、纹理、结构）→ 输出"产品外观锁定描述"
- Prompt 模板强制产品不可修改，仅允许场景/光影/角度变化
- Fallback：Gemini 失败时用产品名称直接拼接 Prompt

---

## 五、API配置

### 环境变量（.env.local）
```
OPENROUTER_API_KEY=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
FEISHU_APP_ID=cli_a92d1001dd385cd1
FEISHU_APP_SECRET=tqeSijGZRAjKQmLK6AX2clQHZtdSZbGo
DASHSCOPE_API_KEY=（已配置，sk-1****8c45）
```

### OpenRouter
- **Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
- **图片返回位置：** `response.choices[0].message.images[0].image_url.url`（base64格式）
- **FLUX modalities:** `["image"]`
- **尺寸控制：** `image_config.aspect_ratio`
- **Gemini视觉：** `google/gemini-2.5-flash`（场景工作台产品图分析）
- **模型定价：** FLUX.2 Klein ~$0.014/张 / Flex ~$0.04/张 / Pro ~$0.08/张

### 阿里云百炼（DashScope）
- **兼容模式:** `https://dashscope.aliyuncs.com/compatible-mode/v1`（文字模型）
- **文生图:** `https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis`（异步）
- **图生图:** `wanx2.6-image`（场景工作台，需公网URL或base64）
- **轮询任务:** `GET https://dashscope.aliyuncs.com/api/v1/tasks/{task_id}`
- **文字模型：** qwen-plus（默认）、qwen-max
- **视觉模型：** qwen-vl-plus、qwen-vl-max
- **图片模型：** wanx2.1-t2i-turbo（默认）、wanx2.1-t2i-plus、wanx-v1
- **图片尺寸格式：** "宽*高"（星号分隔）
- **并发限制：** 并发2 + 1.5秒间隔

---

## 六、共用组件

### SavePathSelector
- 批量生成Step5和场景工作台共用
- 首次保存弹窗让用户选择保存根目录
- 快捷路径选项（D:\product-images-output、./output、桌面/产品图）
- localStorage 持久化路径
- 路径校验（非空、无非法字符、绝对路径）
- 路径不存在自动创建

---

## 七、文件结构（场景工作台相关）

```
src/
├── components/
│   ├── scene/
│   │   ├── SceneWorkbench.tsx        # 场景工作台主容器（三栏布局）
│   │   ├── SceneProductUpload.tsx     # 左栏：产品图上传
│   │   ├── ScenePromptEditor.tsx      # 中栏：提示词编辑 + 模式切换
│   │   ├── ScenePreview.tsx           # 右栏：预览 & 生成结果 & 历史
│   │   ├── SceneTagSelector.tsx       # 场景标签选择器（搜索+折叠）
│   │   ├── SceneHistory.tsx           # 历史记录缩略图列表
│   │   └── SceneModelSelector.tsx     # 模型选择器
│   └── SavePathSelector.tsx           # 共用保存路径选择器
├── lib/
│   └── scene/
│       ├── scenePromptGenerator.ts    # 场景Prompt生成逻辑
│       ├── sceneTags.ts              # 116个场景标签数据（7大分类）
│       └── geminiVision.ts           # Gemini图+文分析封装
└── app/
    └── api/
        └── scene/
            ├── analyze/route.ts       # Gemini图+文分析API
            ├── generate/route.ts      # 场景图生成API
            └── save-results/route.ts  # 场景图保存API
```

---

## 八、版本历史

### v1.0 — 基础流程
- Step1-5 全流程跑通
- 图片URL提取修复、JSON解析三层清洗、本地保存

### v1.1 — 参考图上传
- Step1 参考图上传（最多6张，拖拽，压缩）
- Vision 分析参考图、Prompt融入分析结果

### v1.2 — 类型扩展
- Step3 模型选择 + 类型选择移至Step3
- Step4 费用预估 + 7个亚马逊新图片类型

### v1.3 — 百炼接入
- 全步骤模型选择（百炼免费 + OpenRouter付费双平台）
- DashScope并发限流、编译错误修复

### v2.0 — 场景工作台 🆕
- **Phase 1：** 顶部Tab切换 + 三栏布局骨架 + 产品图上传
- **Phase 2：** 场景标签选择器 + 三种提示词模式 + 高级选项
- **Phase 3：** 图片生成（图生图+文生图）+ Gemini视觉分析 + Prompt强化
- **Phase 4：** 历史记录 + 下载功能
- **后续优化：**
  - Gemini模型更新（2.0-flash-exp → 2.5-flash）
  - 图生图模式接入（DashScope wanx2.6-image）
  - 产品一致性Prompt强化（[PRODUCT-DO NOT MODIFY] + negative prompt）
  - 生成数量选择（1-4张）
  - 保存路径自选（SavePathSelector共用组件）
  - 场景标签扩展至116个（7大分类+搜索+折叠UI）
  - 标签数据来源：2026新品调研(291主题) + Amazon/Etsy/Pinterest市场调研

---

## 九、已知待优化项

### 功能优化
1. **宽幅图片预览** — Banner等宽幅图预览应按实际比例显示
2. **下载兼容性** — 需同时支持 base64 和 URL 两种格式
3. **替换到主流程** — 场景工作台好图一键替换Step5中的某张图（待开发）
4. **费用预估** — 场景工作台生成按钮旁显示费用（待开发）
5. **移动端适配** — 场景工作台三栏布局移动端垂直堆叠（待开发）

### 计划中的新功能
1. **接入更多图片模型** — 可灵AI、即梦AI
2. **内置设计知识库** — 构图法则、色彩理论、亚马逊规范嵌入Prompt
3. **部署到Zeabur** — 团队共用
4. **多模型并发出图对比** — 同一Prompt用多个模型出图
5. **img2img / inpainting** — 真正的背景替换（只换背景不动产品主体）

---

## 十、启动与操作

### 启动项目
```bash
set HTTP_PROXY=http://127.0.0.1:10809
set HTTPS_PROXY=http://127.0.0.1:10809
cd C:\projects\product-image-ai
rmdir /s /q .next && npm run dev
# 访问 http://localhost:3010（端口看终端提示）
```

### Git操作
```bash
# 备份
git add -A && git commit -m "备份说明"

# 查看历史
git log --oneline

# 回滚
git checkout <hash> -- 文件路径

# 清缓存重启
taskkill /f /im node.exe && rmdir /s /q .next && npm run dev
```

### 常见问题
| 问题 | 解决方法 |
|---|---|
| ChunkLoadError / 样式丢失 | 删 .next，重启，Ctrl+Shift+R |
| OpenRouter余额不足 | 充值或切百炼 |
| 通义万相 rate limit | 等几秒重试 |
| Gemini API error | 检查模型名是否最新，fallback到产品名Prompt |
| 图生图 url error | 检查图片是否为公网可访问URL |
| 场景工作台产品不一致 | 确认图生图模式已启用，检查Gemini分析结果 |

---

## 十一、Git提交历史

```
v1.0     基础功能完成：Step1-5全流程
v1.1     参考图上传+Vision分析+Prompt融入
v1.2     Step3模型选择+类型扩展+费用预估
v1.3     接入百炼平台+全步骤模型选择
fix      各项编译错误修复
v2.0     场景工作台Phase1：骨架+三栏布局+产品图上传
         场景工作台Phase2：标签选择+提示词模式+高级选项
         场景工作台Phase3：图片生成+Gemini视觉+图生图
         场景工作台Phase4：历史记录+下载
fix      Gemini模型名更新+fallback修复
fix      图生图接入+产品一致性Prompt强化
feat     生成数量选择(1-4张)
feat     保存路径自选(SavePathSelector共用)
feat     场景标签扩展到7大分类116个+搜索+折叠UI
```

---

## 十二、场景标签数据来源

### 内部数据
- **2026新品调研表**（291个派对主题）→ 提炼节日、场合、色彩、风格、元素等标签

### 外部市场调研
- **Amazon US** — Best Sellers Party Decorations 热搜主题
- **Etsy** — 2025/2026 Trend Report（Nonna Holiday、Supper Club、Play Haus、Gothmas等）
- **Pinterest Predicts 2026** — 21个趋势预测（Afrohemian +220%、Cool Blue、Neo Art Deco、Circus +150%等）
- **Meri Meri** — 2026 Party Trends（Chateaucore、Disco、Pirate、Charm Bracelet等）
- **The Party Darling** — 2026趋势（Amalfi Blue & Lemon #1、Bow Theme、Fruit Theme）
- **Pantone** — 2026年度色 Cloud Dancer（云白色）、2025延续色 Mocha Mousse

---

*文档v3更新于2026年4月8日*
