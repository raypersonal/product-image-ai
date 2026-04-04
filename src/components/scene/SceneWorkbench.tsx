'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import SceneProductUpload from './SceneProductUpload';
import ScenePromptEditor from './ScenePromptEditor';
import SceneModelSelector from './SceneModelSelector';
import ScenePreview from './ScenePreview';
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
  negativePrompt: string;
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
  generationProgress: number;
  currentImage: GeneratedSceneImage | null;
  history: GeneratedSceneImage[];
  // 错误
  error: string | null;
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
  negativePrompt: '',
  isPromptEdited: false,
  platform: 'dashscope',
  imageModel: 'wanx2.1-t2i-turbo',
  outputSize: '1:1',
  styleStrength: 50,
  referenceWeight: 50,
  isGeneratingPrompt: false,
  isAnalyzing: false,
  isGenerating: false,
  generationProgress: 0,
  currentImage: null,
  history: [],
  error: null,
};

interface SaveResult {
  outputPath: string;
  folderName: string;
  successCount: number;
  failedCount: number;
  totalImages: number;
}

export default function SceneWorkbench() {
  const [state, setState] = useState<SceneState>(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 使用 ref 保存最新的 state，避免闭包陈旧问题
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

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
      prompt: mode === 'manual' ? '' : prev.prompt,
      negativePrompt: mode === 'manual' ? '' : prev.negativePrompt,
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

  // 生成提示词（使用 Mock 或 Gemini）
  const handleGeneratePrompt = useCallback(async () => {
    // 使用 ref 获取最新的 state，避免闭包陈旧问题
    const currentState = stateRef.current;
    console.log('>>> handleGeneratePrompt called');
    console.log('>>> selectedTags:', currentState.selectedTags);

    setState(prev => ({ ...prev, isGeneratingPrompt: true, error: null }));

    try {
      // 如果有产品图，使用 Gemini 分析
      if (currentState.productImages.length > 0) {
        console.log('\n>>> Generating prompt with Gemini Vision (product image detected)');
        console.log('>>> Product Name:', currentState.productInfo.name || '(empty)');

        const response = await fetch('/api/scene/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productImageBase64: currentState.productImages[0].base64,
            productName: currentState.productInfo.name,
            productCategory: currentState.productInfo.category,
            productDescription: currentState.productInfo.description,
            sceneTags: currentState.selectedTags.filter(t =>
              ['birthday', 'wedding', 'valentines', 'halloween', 'christmas', 'july4th', 'easter', 'babyshower',
               'outdoor', 'home', 'beach', 'garden', 'studio', 'white'].includes(t)
            ),
            styleTags: currentState.selectedTags.filter(t =>
              ['minimalist', 'luxury', 'rustic', 'modern', 'cute', 'spring', 'summer', 'autumn', 'winter'].includes(t)
            ),
            referenceWeight: currentState.referenceWeight,
            useMock: false, // 使用真实 Gemini API
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Gemini 分析失败');
        }

        const result = await response.json();
        setState(prev => ({
          ...prev,
          prompt: result.prompt,
          negativePrompt: result.negativePrompt || '',
          isPromptEdited: false,
          isGeneratingPrompt: false,
        }));
      } else {
        // 没有产品图，使用简单的 Prompt 生成
        console.log('\n>>> Generating prompt without image (using mock generator)');
        console.log('>>> selectedTags:', currentState.selectedTags);
        console.log('>>> Product Name:', currentState.productInfo.name || '(empty)');

        const result = await generateScenePrompt({
          productName: currentState.productInfo.name,
          productCategory: currentState.productInfo.category,
          productDescription: currentState.productInfo.description,
          selectedTags: currentState.selectedTags,
          styleStrength: currentState.styleStrength,
          referenceWeight: currentState.referenceWeight,
          hasReferenceImages: false,
        });

        setState(prev => ({
          ...prev,
          prompt: result.prompt,
          negativePrompt: result.negativePrompt || '',
          isPromptEdited: false,
          isGeneratingPrompt: false,
        }));
      }
    } catch (error) {
      console.error('Failed to generate prompt:', error);
      setState(prev => ({
        ...prev,
        isGeneratingPrompt: false,
        error: error instanceof Error ? error.message : '提示词生成失败',
      }));
    }
  }, []); // 使用 stateRef 避免依赖，防止闭包陈旧

  // 生成图片
  const handleGenerateImage = useCallback(async () => {
    if (!state.prompt) return;

    setState(prev => ({ ...prev, isGenerating: true, generationProgress: 0, error: null }));

    // 判断是否使用图生图模式
    const useImg2Img = state.productImages.length > 0;

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           STARTING IMAGE GENERATION                         ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║ Mode: ${useImg2Img ? '🖼️ 图生图 (wan2.6-image)' : '📝 文生图 (text2img)'}`);
    console.log(`║ Product Images: ${state.productImages.length}`);
    console.log(`║ Product Name: ${state.productInfo.name || '(empty)'}`);
    console.log('║ Prompt:', state.prompt.substring(0, 150) + '...');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // 模拟进度
    const progressInterval = setInterval(() => {
      setState(prev => ({
        ...prev,
        generationProgress: Math.min(prev.generationProgress + Math.random() * 10, 85),
      }));
    }, 800);

    try {
      let response: Response;

      if (useImg2Img) {
        // 使用图生图 API - 保持产品主体，替换背景
        console.log('>>> Using IMG2IMG API (wan2.6-image)...');

        // 构建场景描述（从选中的标签生成）
        const sceneDescription = state.selectedTags.length > 0
          ? `将产品放置在${state.selectedTags.join('、')}场景中`
          : '将产品放置在专业摄影场景中';

        response = await fetch('/api/scene/img2img', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productImageBase64: state.productImages[0].base64,
            scenePrompt: state.prompt,
            negativePrompt: state.negativePrompt,
            size: state.outputSize === '1:1' ? '1024*1024' :
                  state.outputSize === '4:3' ? '1024*768' :
                  state.outputSize === '3:4' ? '768*1024' :
                  state.outputSize === '16:9' ? '1280*720' :
                  state.outputSize === '9:16' ? '720*1280' : '1024*1024',
            productName: state.productInfo.name,
          }),
        });
      } else {
        // 使用文生图 API
        console.log('>>> Using TEXT2IMG API...');

        response = await fetch('/api/scene/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: state.prompt,
            negativePrompt: state.negativePrompt,
            model: state.imageModel,
            aspectRatio: state.outputSize,
            platform: state.platform,
          }),
        });
      }

      clearInterval(progressInterval);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '图片生成失败');
      }

      const result = await response.json();

      const newImage: GeneratedSceneImage = {
        id: `scene-${Date.now()}`,
        imageData: result.imageUrl,
        prompt: state.prompt,
        model: useImg2Img ? 'wan2.6-image (img2img)' : state.imageModel,
        tags: state.selectedTags,
        timestamp: Date.now(),
        size: state.outputSize,
      };

      setState(prev => ({
        ...prev,
        isGenerating: false,
        generationProgress: 100,
        currentImage: newImage,
        history: [newImage, ...prev.history].slice(0, 20),
      }));

      console.log('✅ Image generation completed!');
    } catch (error) {
      clearInterval(progressInterval);
      console.error('❌ Failed to generate image:', error);
      setState(prev => ({
        ...prev,
        isGenerating: false,
        generationProgress: 0,
        error: error instanceof Error ? error.message : '图片生成失败',
      }));
    }
  }, [state.prompt, state.negativePrompt, state.imageModel, state.outputSize, state.platform, state.selectedTags, state.productImages, state.productInfo.name]);

  // 重新生成
  const handleRegenerate = useCallback(() => {
    handleGenerateImage();
  }, [handleGenerateImage]);

  // 下载图片
  const handleDownload = useCallback((image: GeneratedSceneImage) => {
    console.log('Download:', image.id);
  }, []);

  // 选择历史图片
  const handleSelectHistory = useCallback((image: GeneratedSceneImage) => {
    setState(prev => ({ ...prev, currentImage: image }));
  }, []);

  // 替换到主流程
  const handleReplaceToMainFlow = useCallback((image: GeneratedSceneImage) => {
    console.log('Replace to main flow:', image.id);
    alert('此功能将在后续版本实现');
  }, []);

  // 保存到本地
  const handleSaveToLocal = useCallback(async () => {
    if (state.history.length === 0) {
      alert('没有可保存的图片');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/scene/save-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: state.productInfo.name || 'unnamed_product',
          productInfo: state.productInfo,
          history: state.history,
          productImages: state.productImages,
          config: {
            promptMode: state.promptMode,
            outputSize: state.outputSize,
            styleStrength: state.styleStrength,
            referenceWeight: state.referenceWeight,
            platform: state.platform,
            imageModel: state.imageModel,
            selectedTags: state.selectedTags,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '保存失败');
      }

      setSaveResult(data);
      console.log('✅ Scene saved to:', data.folderName);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  }, [state.history, state.productInfo, state.productImages, state.promptMode, state.outputSize, state.styleStrength, state.referenceWeight, state.platform, state.imageModel, state.selectedTags]);

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

  // 平台和模型
  const setPlatform = useCallback((platform: 'dashscope' | 'openrouter') => {
    setState(prev => ({ ...prev, platform }));
  }, []);

  const setImageModel = useCallback((model: string) => {
    setState(prev => ({ ...prev, imageModel: model }));
  }, []);

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
        <SceneModelSelector
          platform={state.platform}
          imageModel={state.imageModel}
          onSetPlatform={setPlatform}
          onSetImageModel={setImageModel}
        />
      </div>

      {/* 错误提示 */}
      {state.error && (
        <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/30 text-red-400 text-sm flex items-center justify-between">
          <span>❌ {state.error}</span>
          <button
            onClick={() => setState(prev => ({ ...prev, error: null }))}
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

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
        <div className="w-[40%] min-w-[400px] overflow-y-auto">
          <ScenePreview
            isGenerating={state.isGenerating}
            generationProgress={state.generationProgress}
            currentImage={state.currentImage}
            history={state.history}
            prompt={state.prompt}
            onGenerate={handleGenerateImage}
            onRegenerate={handleRegenerate}
            onDownload={handleDownload}
            onSelectHistory={handleSelectHistory}
            onReplaceToMainFlow={handleReplaceToMainFlow}
            outputSize={state.outputSize}
            platform={state.platform}
            imageModel={state.imageModel}
            hasProductImages={state.productImages.length > 0}
            isSaving={isSaving}
            saveResult={saveResult}
            saveError={saveError}
            onSaveToLocal={handleSaveToLocal}
            onClearSaveError={() => setSaveError(null)}
          />
        </div>
      </div>
    </div>
  );
}
