'use client';

import { useState, useCallback } from 'react';
import SceneProductUpload from './SceneProductUpload';
import ScenePromptEditor from './ScenePromptEditor';
import { generateScenePrompt } from '@/lib/scene/scenePromptGenerator';

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
  isGeneratingPrompt: boolean;
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
  isGeneratingPrompt: false,
  isAnalyzing: false,
  isGenerating: false,
  currentImage: null,
  history: [],
};

export default function SceneWorkbench() {
  const [state, setState] = useState<SceneState>(initialState);

  // 更新产品图
  const addProductImage = useCallback((image: UploadedImage) => {
    setState(prev => ({
      ...prev,
      productImages: [...prev.productImages, image],
    }));
  }, []);

  const removeProductImage = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      productImages: prev.productImages.filter(img => img.id !== id),
    }));
  }, []);

  const updateProductImage = useCallback((id: string, updates: Partial<UploadedImage>) => {
    setState(prev => ({
      ...prev,
      productImages: prev.productImages.map(img =>
        img.id === id ? { ...img, ...updates } : img
      ),
    }));
  }, []);

  // 更新产品信息
  const setProductInfo = useCallback((info: Partial<SceneProductInfo>) => {
    setState(prev => ({
      ...prev,
      productInfo: { ...prev.productInfo, ...info },
    }));
  }, []);

  // 标签操作
  const toggleTag = useCallback((tagId: string) => {
    setState(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter(id => id !== tagId)
        : [...prev.selectedTags, tagId],
    }));
  }, []);

  const clearTags = useCallback(() => {
    setState(prev => ({ ...prev, selectedTags: [] }));
  }, []);

  // 提示词模式
  const setPromptMode = useCallback((mode: PromptMode) => {
    setState(prev => ({
      ...prev,
      promptMode: mode,
      // 切换到手动模式时清空自动生成的内容
      prompt: mode === 'manual' ? '' : prev.prompt,
      isPromptEdited: false,
    }));
  }, []);

  // 设置提示词
  const setPrompt = useCallback((prompt: string) => {
    setState(prev => ({
      ...prev,
      prompt,
      isPromptEdited: prev.promptMode === 'hybrid' && prompt !== prev.prompt,
    }));
  }, []);

  // 生成提示词
  const handleGeneratePrompt = useCallback(async () => {
    setState(prev => ({ ...prev, isGeneratingPrompt: true }));

    try {
      const result = await generateScenePrompt({
        productName: state.productInfo.name,
        productCategory: state.productInfo.category,
        productDescription: state.productInfo.description,
        selectedTags: state.selectedTags,
        styleStrength: state.styleStrength,
        referenceWeight: state.referenceWeight,
        hasReferenceImages: state.productImages.length > 0,
      });

      setState(prev => ({
        ...prev,
        prompt: result.prompt,
        isPromptEdited: false,
        isGeneratingPrompt: false,
      }));
    } catch (error) {
      console.error('Failed to generate prompt:', error);
      setState(prev => ({ ...prev, isGeneratingPrompt: false }));
    }
  }, [state.productInfo, state.selectedTags, state.styleStrength, state.referenceWeight, state.productImages.length]);

  // 高级选项
  const setOutputSize = useCallback((size: string) => {
    setState(prev => ({ ...prev, outputSize: size }));
  }, []);

  const setStyleStrength = useCallback((value: number) => {
    setState(prev => ({ ...prev, styleStrength: value }));
  }, []);

  const setReferenceWeight = useCallback((value: number) => {
    setState(prev => ({ ...prev, referenceWeight: value }));
  }, []);

  // 生成图片（Phase 3 实现）
  const handleGenerateImage = useCallback(async () => {
    if (!state.prompt) return;

    setState(prev => ({ ...prev, isGenerating: true }));

    // TODO: Phase 3 实现图片生成 API 调用
    // Mock: 模拟生成延迟
    await new Promise(resolve => setTimeout(resolve, 2000));

    setState(prev => ({ ...prev, isGenerating: false }));
  }, [state.prompt]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎨</span>
          <h1 className="font-bold text-foreground">场景工作台</h1>
          <span className="text-xs text-muted px-2 py-0.5 bg-secondary rounded">Beta</span>
        </div>

        {/* 模型选择器 */}
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
        <div className="w-[35%] min-w-[320px] border-r border-border overflow-y-auto">
          <ScenePromptEditor
            selectedTags={state.selectedTags}
            onToggleTag={toggleTag}
            onClearTags={clearTags}
            promptMode={state.promptMode}
            onSetPromptMode={setPromptMode}
            prompt={state.prompt}
            onSetPrompt={setPrompt}
            isPromptEdited={state.isPromptEdited}
            productImages={state.productImages}
            productInfo={state.productInfo}
            outputSize={state.outputSize}
            onSetOutputSize={setOutputSize}
            styleStrength={state.styleStrength}
            onSetStyleStrength={setStyleStrength}
            referenceWeight={state.referenceWeight}
            onSetReferenceWeight={setReferenceWeight}
            isGeneratingPrompt={state.isGeneratingPrompt}
            onGeneratePrompt={handleGeneratePrompt}
          />
        </div>

        {/* 右栏：预览 & 生成结果 (40%) */}
        <div className="w-[40%] min-w-[400px] overflow-y-auto p-4">
          <div className="space-y-4">
            {/* 生成按钮 */}
            <button
              onClick={handleGenerateImage}
              disabled={state.isGenerating || !state.prompt}
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

            {/* 状态提示 */}
            {!state.prompt && (
              <div className="text-center text-sm text-muted py-2">
                {state.promptMode === 'auto' || state.promptMode === 'hybrid'
                  ? '请先选择场景标签并生成提示词'
                  : '请在中栏输入提示词'}
              </div>
            )}

            {/* 费用预估 */}
            <div className="text-center text-xs text-muted">
              预估费用: {state.platform === 'dashscope' ? '免费额度' : '$0.02 / 张'}
              <span className="mx-2">|</span>
              尺寸: {state.outputSize}
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
                <div className="text-center text-muted p-8">
                  <div className="text-6xl mb-4">🖼️</div>
                  <p className="text-sm">生成的场景图将显示在这里</p>
                  <p className="text-xs mt-2 text-muted/70">
                    {state.selectedTags.length > 0
                      ? `已选 ${state.selectedTags.length} 个场景标签`
                      : '选择场景标签开始'}
                  </p>
                </div>
              )}
            </div>

            {/* 操作按钮（有图片时显示） */}
            {state.currentImage && (
              <div className="flex gap-2">
                <button className="flex-1 py-2 bg-secondary text-foreground rounded-lg text-sm hover:bg-secondary-hover transition-colors">
                  🔄 重新生成
                </button>
                <button className="flex-1 py-2 bg-secondary text-foreground rounded-lg text-sm hover:bg-secondary-hover transition-colors">
                  📥 下载
                </button>
                <button className="flex-1 py-2 bg-primary/20 text-primary rounded-lg text-sm hover:bg-primary/30 transition-colors">
                  ✅ 替换到主流程
                </button>
              </div>
            )}

            {/* 历史记录区 */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <span>📜</span>
                历史记录
                {state.history.length > 0 && (
                  <span className="text-muted">({state.history.length})</span>
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
                      className="aspect-square bg-secondary rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
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
