'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  ALL_IMAGE_TYPES,
  IMAGE_MODEL_OPTIONS,
  getTypeConfig,
  calculateEstimatedCost,
  getCoreTypes,
  getAdditionalTypes,
  isDashScopeModel,
  isFreeTierModel,
  formatCostDisplay,
} from '@/types';

export default function Step4Generate() {
  const {
    prompts,
    images,
    setImages,
    updateImage,
    initializeImages,
    selectedModel,
    setSelectedModel,
    enabledTypes,
    toggleType,
    enableAllTypes,
    disableAllTypes,
    enableCoreTypesOnly,
    typeSizeMap,
    setTypeSize,
  } = useApp();

  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedType, setExpandedType] = useState<string | null>('main');

  // 计算启用的类型和图片数量
  const enabledTypeCount = useMemo(() => {
    return Object.values(enabledTypes).filter(Boolean).length;
  }, [enabledTypes]);

  const totalImageCount = useMemo(() => {
    return ALL_IMAGE_TYPES.reduce((sum, t) => {
      if (enabledTypes[t.id]) {
        return sum + t.count;
      }
      return sum;
    }, 0);
  }, [enabledTypes]);

  // 计算预估费用
  const estimatedCost = useMemo(() => {
    return calculateEstimatedCost(totalImageCount, selectedModel);
  }, [totalImageCount, selectedModel]);

  const pricePerImage = useMemo(() => {
    const model = IMAGE_MODEL_OPTIONS.find(m => m.value === selectedModel);
    return model?.pricePerImage || 0.04;
  }, [selectedModel]);

  // 只获取启用类型的 prompts
  const enabledPrompts = useMemo(() => {
    return prompts.filter(p => enabledTypes[p.type]);
  }, [prompts, enabledTypes]);

  // 检测哪些启用的类型缺少 Prompt（需要返回 Step3 生成）
  const missingPromptTypes = useMemo(() => {
    const promptTypeIds = new Set(prompts.map(p => p.type));
    return ALL_IMAGE_TYPES.filter(t => enabledTypes[t.id] && !promptTypeIds.has(t.id));
  }, [prompts, enabledTypes]);

  // 初始化 images（只为启用类型）
  useEffect(() => {
    if (enabledPrompts.length > 0 && images.length === 0) {
      const newImages = enabledPrompts.map(prompt => ({
        id: `img-${prompt.id}`,
        promptId: prompt.id,
        url: null,
        status: 'pending' as const,
        aspectRatio: typeSizeMap[prompt.type] || '1:1',
      }));
      setImages(newImages);
    }
  }, [enabledPrompts.length, images.length, setImages, typeSizeMap]);

  // 当 enabledTypes 或 typeSizeMap 变化时，更新 images 列表
  useEffect(() => {
    if (prompts.length > 0) {
      const currentPromptIds = new Set(images.map(img => img.promptId));
      const newImages = enabledPrompts
        .filter(p => !currentPromptIds.has(p.id))
        .map(prompt => ({
          id: `img-${prompt.id}`,
          promptId: prompt.id,
          url: null,
          status: 'pending' as const,
          aspectRatio: typeSizeMap[prompt.type] || '1:1',
        }));

      if (newImages.length > 0) {
        setImages(prev => [...prev, ...newImages]);
      }

      // 移除禁用类型的 images
      const enabledPromptIds = new Set(enabledPrompts.map(p => p.id));
      setImages(prev => prev.filter(img => enabledPromptIds.has(img.promptId)));
    }
  }, [enabledTypes, typeSizeMap]);

  const generateSingleImage = useCallback(async (promptId: string): Promise<boolean> => {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return false;

    const typeConfig = getTypeConfig(prompt.type);
    const aspectRatio = typeSizeMap[prompt.type] || typeConfig?.defaultSize || '1:1';

    // 获取实际的 OpenRouter aspect_ratio
    const sizeOption = typeConfig?.sizeOptions.find(s => s.value === aspectRatio);
    const actualAspectRatio = sizeOption?.aspectRatio || aspectRatio;

    const imageId = `img-${promptId}`;
    updateImage(imageId, { status: 'generating' });

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.prompt,
          model: selectedModel,
          aspectRatio: actualAspectRatio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '图片生成失败');
      }

      updateImage(imageId, { status: 'completed', url: data.url, aspectRatio });
      return true;
    } catch (err) {
      updateImage(imageId, {
        status: 'failed',
        error: err instanceof Error ? err.message : '生成失败',
      });
      return false;
    }
  }, [prompts, selectedModel, typeSizeMap, updateImage]);

  const generateAllImages = async () => {
    if (enabledTypeCount === 0) return;

    setIsGenerating(true);

    // 并发控制：DashScope 限制为 2，OpenRouter 保持 5
    const isDashScope = isDashScopeModel(selectedModel);
    const concurrency = isDashScope ? 2 : 5;
    const delayBetweenBatches = isDashScope ? 1500 : 0; // DashScope 每批之间延迟 1.5 秒

    const pendingPromptIds = enabledPrompts
      .filter(p => {
        const img = images.find(i => i.promptId === p.id);
        return !img || img.status === 'pending' || img.status === 'failed';
      })
      .map(p => p.id);

    for (let i = 0; i < pendingPromptIds.length; i += concurrency) {
      const batch = pendingPromptIds.slice(i, i + concurrency);
      await Promise.all(batch.map(id => generateSingleImage(id)));

      // DashScope 模型在每批之间添加延迟，避免触发限流
      if (isDashScope && i + concurrency < pendingPromptIds.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    setIsGenerating(false);
  };

  const handleGenerateSingle = async (promptId: string) => {
    await generateSingleImage(promptId);
  };

  // 只统计启用类型的图片
  const enabledImages = useMemo(() => {
    const enabledPromptIds = new Set(enabledPrompts.map(p => p.id));
    return images.filter(img => enabledPromptIds.has(img.promptId));
  }, [images, enabledPrompts]);

  const completedCount = enabledImages.filter(img => img.status === 'completed').length;
  const failedCount = enabledImages.filter(img => img.status === 'failed').length;
  const generatingCount = enabledImages.filter(img => img.status === 'generating').length;
  const totalCount = enabledImages.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // 按类型分组
  const coreTypes = getCoreTypes();
  const additionalTypes = getAdditionalTypes();

  const renderTypeSection = (typeConfig: typeof ALL_IMAGE_TYPES[0]) => {
    const isEnabled = enabledTypes[typeConfig.id];
    const typeImages = enabledImages.filter(img => {
      const prompt = prompts.find(p => p.id === img.promptId);
      return prompt?.type === typeConfig.id;
    });
    const completedInType = typeImages.filter(i => i.status === 'completed').length;
    const currentSize = typeSizeMap[typeConfig.id] || typeConfig.defaultSize;

    return (
      <div key={typeConfig.id} className={`mb-3 bg-secondary rounded-lg overflow-hidden ${!isEnabled ? 'opacity-50' : ''}`}>
        <div className="px-4 py-3 flex items-center gap-3">
          {/* 勾选框 */}
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={() => toggleType(typeConfig.id)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />

          {/* 类型名和数量 */}
          <button
            onClick={() => isEnabled && setExpandedType(expandedType === typeConfig.id ? null : typeConfig.id)}
            className="flex-1 flex items-center justify-between hover:bg-secondary-hover transition-colors rounded px-2 py-1"
            disabled={!isEnabled}
          >
            <span className={`font-medium ${isEnabled ? 'text-foreground' : 'text-muted'}`}>
              {typeConfig.name}
              <span className="text-muted text-sm ml-2">
                （{isEnabled ? `${completedInType}/${typeConfig.count}` : `×${typeConfig.count}`}）
              </span>
            </span>
            {isEnabled && (
              <span className={`transform transition-transform ${expandedType === typeConfig.id ? 'rotate-180' : ''}`}>
                ▼
              </span>
            )}
          </button>

          {/* 尺寸选择 */}
          {isEnabled && typeConfig.sizeOptions.length > 1 && (
            <select
              value={currentSize}
              onChange={(e) => setTypeSize(typeConfig.id, e.target.value)}
              className="px-2 py-1 bg-background border border-border rounded text-sm text-foreground min-w-[140px]"
              onClick={(e) => e.stopPropagation()}
            >
              {typeConfig.sizeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          )}

          {/* 固定尺寸显示 */}
          {isEnabled && typeConfig.sizeOptions.length === 1 && (
            <span className="text-xs text-muted px-2 py-1 bg-background rounded">
              {typeConfig.sizeOptions[0].label}
            </span>
          )}
        </div>

        {/* 展开的图片网格 */}
        {isEnabled && expandedType === typeConfig.id && (
          <div className="border-t border-border p-4">
            <div className="grid grid-cols-3 gap-4">
              {typeImages.map((image) => {
                const prompt = prompts.find(p => p.id === image.promptId);
                return (
                  <div
                    key={image.id}
                    className="aspect-square bg-background rounded-lg overflow-hidden relative border border-border"
                  >
                    {image.status === 'pending' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-muted">
                        <div className="text-3xl mb-2">🖼️</div>
                        <span className="text-xs">待生成</span>
                        <button
                          onClick={() => handleGenerateSingle(image.promptId)}
                          className="mt-2 px-3 py-1 bg-primary/20 text-primary rounded text-xs hover:bg-primary/30"
                        >
                          生成
                        </button>
                      </div>
                    )}

                    {image.status === 'generating' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary/10">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="text-xs text-primary">生成中...</span>
                      </div>
                    )}

                    {image.status === 'completed' && image.url && (
                      <img
                        src={image.url}
                        alt={`${prompt?.typeName} ${prompt?.index}`}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {image.status === 'failed' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-error/10 text-error">
                        <div className="text-3xl mb-2">❌</div>
                        <span className="text-xs text-center px-2">{image.error || '生成失败'}</span>
                        <button
                          onClick={() => handleGenerateSingle(image.promptId)}
                          className="mt-2 px-3 py-1 bg-error/20 text-error rounded text-xs hover:bg-error/30"
                        >
                          重试
                        </button>
                      </div>
                    )}

                    {/* 序号标签 */}
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
                      #{prompt?.index}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* 步骤说明 */}
      <div className="p-4 border-b border-border bg-secondary/50">
        <h2 className="text-lg font-bold text-foreground">🎨 Step 4: 生成图片</h2>
        <p className="text-sm text-muted mt-1">
          选择模型和每种类型的尺寸，开始生成产品图片
        </p>
      </div>

      {/* 控制栏 */}
      <div className="p-4 border-b border-border bg-secondary/30">
        <div className="flex flex-wrap gap-4 items-center">
          {/* AI 模型选择 */}
          <div>
            <label className="block text-xs text-muted mb-1">图片生成模型</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground min-w-[260px]"
            >
              <optgroup label="百炼（DashScope）- 有免费额度">
                {IMAGE_MODEL_OPTIONS.filter(m => m.provider === 'dashscope').map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} {option.isFree ? '(免费)' : `($${option.pricePerImage}/张)`}
                  </option>
                ))}
              </optgroup>
              <optgroup label="OpenRouter（FLUX）">
                {IMAGE_MODEL_OPTIONS.filter(m => m.provider === 'openrouter').map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} (${option.pricePerImage}/张)
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* 快捷操作 */}
          <div className="flex gap-2">
            <button
              onClick={enableAllTypes}
              className="px-2 py-1 bg-secondary text-foreground rounded text-xs hover:bg-secondary-hover"
            >
              全选
            </button>
            <button
              onClick={disableAllTypes}
              className="px-2 py-1 bg-secondary text-foreground rounded text-xs hover:bg-secondary-hover"
            >
              全不选
            </button>
            <button
              onClick={enableCoreTypesOnly}
              className="px-2 py-1 bg-secondary text-foreground rounded text-xs hover:bg-secondary-hover"
            >
              仅基础图
            </button>
          </div>

          <div className="flex-1"></div>

          {/* 统计和费用 */}
          <div className="text-right">
            <div className="text-sm text-muted">
              已选 <span className="text-primary font-bold">{enabledTypeCount}</span> 个类型，
              共 <span className="text-primary font-bold">{totalImageCount}</span> 张图片
            </div>
            <div className="text-xs mt-1">
              {isFreeTierModel(selectedModel) ? (
                <span className="text-primary font-bold">预估费用：免费额度</span>
              ) : (
                <span className="text-muted">
                  预估费用：{totalImageCount}张 × ${pricePerImage.toFixed(3)} = <span className="text-primary font-bold">${estimatedCost.toFixed(2)}</span>
                </span>
              )}
            </div>
            <div className="text-xs text-muted mt-1">
              {isDashScopeModel(selectedModel) ? (
                <span className="text-primary">使用百炼平台（并发2，较慢但免费）</span>
              ) : (
                <span>使用 OpenRouter（并发5）</span>
              )}
            </div>
          </div>
        </div>

        {/* 缺少 Prompt 的警告 */}
        {missingPromptTypes.length > 0 && (
          <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <div className="text-sm text-warning">
              ⚠️ 以下类型尚未生成 Prompt，请返回 Step 3 重新生成：
              <span className="font-bold ml-1">
                {missingPromptTypes.map(t => t.name).join('、')}
              </span>
            </div>
          </div>
        )}

        {/* 生成按钮和进度 */}
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={generateAllImages}
            disabled={isGenerating || enabledTypeCount === 0 || missingPromptTypes.length > 0}
            className="px-6 py-3 bg-primary text-background rounded-lg font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enabledTypeCount === 0
              ? '请至少选择一个图片类型'
              : missingPromptTypes.length > 0
                ? '请先返回 Step3 生成缺少的 Prompt'
                : isGenerating
                  ? '生成中...'
                  : `🎨 开始生成全部图片（${totalImageCount}张）`
            }
          </button>

          {/* 进度条 */}
          {totalCount > 0 && (
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted">
                  进度：
                  <span className="text-primary">{completedCount}</span>
                  /{totalCount}
                  {failedCount > 0 && <span className="text-error ml-2">（失败 {failedCount}）</span>}
                  {generatingCount > 0 && <span className="text-warning ml-2">（生成中 {generatingCount}）</span>}
                </span>
                <span className="text-muted">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 图片类型列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 核心类型 */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-primary mb-2">📦 基础图片类型</h3>
          {coreTypes.map(typeConfig => renderTypeSection(typeConfig))}
        </div>

        {/* 分隔线 */}
        <div className="border-t border-border my-4 pt-4">
          <h3 className="text-sm font-medium text-muted mb-2">📎 附加图片类型（可选）</h3>
          {additionalTypes.map(typeConfig => renderTypeSection(typeConfig))}
        </div>
      </div>
    </div>
  );
}
