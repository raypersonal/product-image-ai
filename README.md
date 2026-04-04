# 产品图AI生成工具

一个为跨境电商团队设计的亚马逊产品图AI生成工具。通过简单的五步流程，即使是新人也能快速生成专业的产品图片。

## 功能特点

- **五步工作流程**：产品信息输入 → AI分析 → 生成Prompt → 生成图片 → 下载
- **AI智能分析**：自动分析产品特点，生成视觉风格、色彩方案、目标人群建议
- **批量图片生成**：一次生成26张产品图（主图、卖点图、场景图、细节图、使用图、手持图）
- **多模型支持**：支持 Flux Pro / Flux Dev / Flux Schnell 三种模型
- **飞书集成**：可从飞书多维表格直接读取产品数据
- **深色主题**：专业的深色界面，长时间使用不伤眼

## 快速开始

### 1. 安装依赖

```bash
cd product-image-ai
npm install
```

### 2. 配置 API Key

有两种方式配置 API Key：

**方式一：通过界面配置（推荐）**
1. 启动项目后点击左下角「API 配置」
2. 填写 OpenRouter API Key
3. （可选）填写飞书应用凭证

**方式二：通过环境变量**
```bash
cp .env.local.example .env.local
# 编辑 .env.local 填写你的 API Key
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 开始使用。

## API Key 获取指南

### OpenRouter API Key（必需）

OpenRouter 是一个 AI 模型聚合平台，支持多种模型的统一调用。

1. 访问 [openrouter.ai](https://openrouter.ai)
2. 点击右上角「Sign In」注册/登录
3. 进入 [Keys 页面](https://openrouter.ai/keys)
4. 点击「Create Key」创建新的 API Key
5. 复制生成的 Key（格式：`sk-or-v1-...`）

**费用说明**：
- DeepSeek Chat（用于产品分析）：约 $0.0001/1K tokens
- Flux Dev（推荐图片模型）：约 $0.025/张图片
- Flux Schnell（快速预览）：约 $0.003/张图片
- Flux Pro（高质量）：约 $0.05/张图片

### 飞书应用凭证（可选）

如果需要从飞书多维表格读取产品数据：

1. 访问 [飞书开放平台](https://open.feishu.cn/app)
2. 点击「创建企业自建应用」
3. 填写应用名称和描述
4. 在「凭证与基础信息」页面获取 App ID 和 App Secret
5. 在「权限管理」中添加以下权限：
   - `bitable:record:read` - 读取多维表格记录
   - `bitable:table:readonly` - 获取表格信息
6. 发布应用并通过审核
7. 将应用添加到包含产品数据的多维表格

## 使用流程

### Step 1: 产品信息输入

- **手动填写**：输入产品名称、类别、描述、卖点等信息
- **从飞书读取**：输入多维表格的 App Token 和 Table ID，选择记录自动填充

### Step 2: AI产品分析

点击「开始分析」，AI 将分析产品并给出：
- 视觉风格建议
- 色彩方案
- 目标人群画像
- 差异化卖点
- 推荐拍摄场景

### Step 3: 生成图片Prompt

点击「一键生成所有Prompt」，为26张图片生成专业的AI绘图描述：
- 主图 ×6：白底产品图
- 卖点图 ×7：突出不同卖点
- 场景图 ×7：生活场景展示
- 细节图 ×2：特写镜头
- 使用图 ×2：使用演示
- 手持图 ×2：比例参考

每条 Prompt 都可以手动编辑或单独重新生成。

### Step 4: 生成图片

- 选择 AI 模型和图片尺寸
- 点击「开始生成全部图片」或单独生成
- 支持并发控制（同时最多5张）
- 失败的图片可以单独重试

### Step 5: 查看 & 下载

- 按类型分组浏览所有图片
- 点击图片查看大图
- 悬停显示下载按钮
- 一键打包下载所有图片（ZIP格式）

## 技术栈

- **框架**：Next.js 14 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **AI模型**：OpenRouter (DeepSeek Chat + Flux)
- **状态管理**：React Context
- **打包下载**：JSZip

## 项目结构

```
product-image-ai/
├── src/
│   ├── app/
│   │   ├── api/           # API 路由
│   │   │   ├── analyze/
│   │   │   ├── generate-prompts/
│   │   │   ├── generate-image/
│   │   │   └── feishu/
│   │   ├── settings/      # 设置页面
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── steps/         # 五个步骤组件
│   │   ├── Sidebar.tsx
│   │   ├── MainContent.tsx
│   │   ├── AnalysisPanel.tsx
│   │   └── StepNavigation.tsx
│   ├── context/
│   │   └── AppContext.tsx # 全局状态
│   └── types/
│       └── index.ts       # 类型定义
├── .env.local.example
├── package.json
└── README.md
```

## 常见问题

**Q: API 调用失败怎么办？**
A: 检查 API Key 是否正确配置，检查网络连接，确保 OpenRouter 账户有足够余额。

**Q: 图片生成很慢？**
A: 可以选择 Flux Schnell 模型进行快速预览，确认效果后再用 Flux Dev/Pro 生成高质量图片。

**Q: 如何修改飞书表格字段映射？**
A: 编辑 `src/components/steps/Step1ProductInfo.tsx` 中的 `handleRecordSelect` 函数。

## License

MIT
