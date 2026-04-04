'use client';

import { useState } from 'react';
import SceneProductUpload from './SceneProductUpload';

// 场景工作台状态类型
export interface UploadedImage {
  id: string;
  base64: string;
  filename: string;
  description: string;
}

export interface SceneProductInfo {
  name: string;
  category: string;
  description: string;
}

export type PromptMode = 'auto' | 'manual' | 'hybrid';

export interface SceneState {
  // 产品图
  productImages: UploadedImage[];
  productInfo: SceneProductInfo;
  // 场景选择
  selectedTags: string[];
  promptMode: PromptMode;
  prompt: string;
  isPromptEdited: boolean;
  // 生成配置
  platform: 'dashscope' | 'openrouter';
  imageModel: string;
  outputSize: string;
  styleStrength: number;
  referenceWeight: number;
  // 生成状态
  isAnalyzing: boolean;
  isGenerating: boolean;
  currentImage: GeneratedSceneImage | null;
  history: GeneratedSceneImage[];
}

export interface GeneratedSceneImage {
  id: string;
  imageData: string;
  prompt: string;
  model: string;
  tags: string[];
  timestamp: number;
  size: string;
}

const initialState: SceneState = {
  productImages: [],
  productInfo: { name: '', category: '', description: '' },
  selectedTags: [],
  promptMode: 'auto',
  prompt: '',
  isPromptEdited: false,
  platform: 'dashscope',
  imageModel: 'wanx2.1-t2i-turbo',
  outputSize: '1:1',
  styleStrength: 50,
  referenceWeight: 50,
  isAnalyzing: false,
  isGenerating: false,
  currentImage: null,
  history: [],
};

export default function SceneWorkbench() {
  const [state, setState] = useState<SceneState>(initialState);

  // 更新产品图
  const setProductImages = (images: UploadedImage[]) => {
    setState(prev => ({ ...prev, productImages: images }));
  };

  const addProductImage = (image: UploadedImage) => {
    setState(prev => ({
      ...prev,
      productImages: [...prev.productImages, image],
    }));
  };

  const removeProductImage = (id: string) => {
    setState(prev => ({
      ...prev,
      productImages: prev.productImages.filter(img => img.id !== id),
    }));
  };

  const updateProductImage = (id: string, updates: Partial<UploadedImage>) => {
    setState(prev => ({
      ...prev,
      productImages: prev.productImages.map(img =>
        img.id === id ? { ...img, ...updates } : img
      ),
    }));
  };

  // 更新产品信息
  const setProductInfo = (info: Partial<SceneProductInfo>) => {
    setState(prev => ({
      ...prev,
      productInfo: { ...prev.productInfo, ...info },
    }));
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎨</span>
          <h1 className="font-bold text-foreground">场景工作台</h1>
          <span className="text-xs text-muted px-2 py-0.5 bg-secondary rounded">Beta</span>
        </div>

        {/* 模型选择器（Phase 3 实现） */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">图片模型:</span>
          <select
            value={state.imageModel}
            onChange={(e) => setState(prev => ({ ...prev, imageModel: e.target.value }))}
            className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground"
          >
            <optgroup label="百炼 (免费额度)">
              <option value="wanx2.1-t2i-turbo">Wanx 2.1 Turbo</option>
              <option value="wanx2.1-t2i-plus">Wanx 2.1 Plus</option>
              <option value="wanx-v1">Wanx V1</option>
            </optgroup>
            <optgroup label="OpenRouter (付费)">
              <option value="flux-schnell">FLUX Schnell</option>
              <option value="flux-dev">FLUX Dev</option>
            </optgroup>
          </select>
        </div>
      </div>

      {/* 三栏主体 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左栏：产品图上传 (25%) */}
        <div className="w-1/4 min-w-[280px] border-r border-border overflow-y-auto">
          <SceneProductUpload
            productImages={state.productImages}
            productInfo={state.productInfo}
            onAddImage={addProductImage}
            onRemoveImage={removeProductImage}
            onUpdateImage={updateProductImage}
            onSetProductInfo={setProductInfo}
          />
        </div>

        {/* 中栏：提示词编辑区 (35%) */}
        <div className="w-[35%] min-w-[320px] border-r border-border overflow-y-auto p-4">
          <div className="space-y-4">
            {/* 模式切换 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">提示词模式</label>
              <div className="flex gap-2">
                {[
                  { value: 'auto', label: '⚡ 自动', desc: '选标签自动生成' },
                  { value: 'manual', label: '✏️ 手动', desc: '自由编写' },
                  { value: 'hybrid', label: '🔀 混合', desc: '自动+微调' },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setState(prev => ({ ...prev, promptMode: mode.value as PromptMode }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                      state.promptMode === mode.value
                        ? 'bg-primary text-background'
                        : 'bg-secondary text-muted hover:text-foreground'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 场景标签区（Phase 2 详细实现） */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">场景快捷标签</label>
              <div className="p-3 bg-secondary/50 rounded-lg border border-border min-h-[120px]">
                <p className="text-sm text-muted text-center py-8">
                  🏷️ 场景标签选择器<br />
                  <span className="text-xs">（Phase 2 实现）</span>
                </p>
              </div>
            </div>

            {/* 提示词文本框 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                提示词
                {state.promptMode === 'auto' && (
                  <span className="text-xs text-muted ml-2">（自动模式下只读）</span>
                )}
              </label>
              <textarea
                value={state.prompt}
                onChange={(e) => setState(prev => ({ ...prev, prompt: e.target.value, isPromptEdited: true }))}
                readOnly={state.promptMode === 'auto'}
                placeholder={
                  state.promptMode === 'auto'
                    ? '选择场景标签后自动生成提示词...'
                    : '输入场景描述，例如：Product placed on a wooden table in a cozy living room with warm lighting...'
                }
                rows={6}
                className={`w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted resize-none ${
                  state.promptMode === 'auto' ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {/* 高级选项（折叠） */}
            <details className="group">
              <summary className="text-sm font-medium text-foreground cursor-pointer hover:text-primary flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform">▶</span>
                高级选项
              </summary>
              <div className="mt-3 space-y-4 pl-4">
                {/* 输出尺寸 */}
                <div>
                  <label className="block text-xs text-muted mb-1">输出尺寸</label>
                  <select
                    value={state.outputSize}
                    onChange={(e) => setState(prev => ({ ...prev, outputSize: e.target.value }))}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground"
                  >
                    <option value="1:1">1:1 (1024×1024)</option>
                    <option value="4:3">4:3 (1024×768)</option>
                    <option value="3:4">3:4 (768×1024)</option>
                    <option value="16:9">16:9 (1280×720)</option>
                    <option value="9:16">9:16 (720×1280)</option>
                    <option value="21:9">21:9 (1260×540)</option>
                  </select>
                </div>

                {/* 风格强度 */}
                <div>
                  <label className="block text-xs text-muted mb-1">
                    风格强度: {state.styleStrength}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={state.styleStrength}
                    onChange={(e) => setState(prev => ({ ...prev, styleStrength: Number(e.target.value) }))}
                    className="w-full accent-primary"
                  />
                </div>

                {/* 参考图权重 */}
                <div>
                  <label className="block text-xs text-muted mb-1">
                    参考图权重: {state.referenceWeight}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={state.referenceWeight}
                    onChange={(e) => setState(prev => ({ ...prev, referenceWeight: Number(e.target.value) }))}
                    className="w-full accent-primary"
                  />
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* 右栏：预览 & 生成结果 (40%) */}
        <div className="w-[40%] min-w-[400px] overflow-y-auto p-4">
          <div className="space-y-4">
            {/* 生成按钮 */}
            <button
              disabled={state.isGenerating}
              className="w-full py-4 bg-primary text-background rounded-xl font-bold text-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {state.isGenerating ? (
                <>
                  <span className="animate-spin">⏳</span>
                  生成中...
                </>
              ) : (
                <>
                  <span>🎨</span>
                  生成场景图
                </>
              )}
            </button>

            {/* 费用预估 */}
            <div className="text-center text-xs text-muted">
              预估费用: {state.platform === 'dashscope' ? '免费额度' : '$0.02 / 张'}
            </div>

            {/* 预览区 */}
            <div className="aspect-square bg-secondary rounded-xl border border-border flex items-center justify-center">
              {state.currentImage ? (
                <img
                  src={state.currentImage.imageData}
                  alt="Generated"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div className="text-center text-muted">
                  <div className="text-6xl mb-4">🖼️</div>
                  <p className="text-sm">生成的场景图将显示在这里</p>
                  <p className="text-xs mt-1">选择场景标签并点击生成</p>
                </div>
              )}
            </div>

            {/* 操作按钮（有图片时显示） */}
            {state.currentImage && (
              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-secondary text-foreground rounded-lg text-sm hover:bg-secondary-hover">
                  🔄 重新生成
                </button>
                <button className="flex-1 py-2 bg-secondary text-foreground rounded-lg text-sm hover:bg-secondary-hover">
                  📥 下载
                </button>
                <button className="flex-1 py-2 bg-primary/20 text-primary rounded-lg text-sm hover:bg-primary/30">
                  ✅ 替换到主流程
                </button>
              </div>
            )}

            {/* 历史记录区 */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                历史记录
                {state.history.length > 0 && (
                  <span className="text-muted ml-2">({state.history.length})</span>
                )}
              </h3>
              {state.history.length === 0 ? (
                <div className="p-4 bg-secondary/30 rounded-lg text-center text-sm text-muted">
                  暂无历史记录
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {state.history.slice(0, 20).map((img) => (
                    <div
                      key={img.id}
                      className="aspect-square bg-secondary rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary"
                    >
                      <img
                        src={img.imageData}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
