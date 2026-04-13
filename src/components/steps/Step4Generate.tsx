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
  getAspectRatioStyle,
  isWideAspectRatio,
} from '@/types';

export default function Step4Generate() {
  const {
    prompts,
    images,
    setImages,
    updateImage,
    selectedModel,
    setSelectedModel,
    enabledTypes,
    typeSizeMap,
    setTypeSize,
  } = useApp();

  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedType, setExpandedType] = useState<string | null>(null);

  // 只获取启用类型的 prompts（已在 Step3 选择）
  const enabledPrompts = useMemo(() => {
    return prompts.filter(p => enabledTypes[p.type]);
  }, [prompts, enabledTypes]);

  // 计算启用的类型数量
  const enabledTypeCount = useMemo(() => {
    return ALL_IMAGE_TYPES.filter(t => enabledTypes[t.id]).length;
  }, [enabledTypes]);

  // 计算图片总数
  const totalImageCount = useMemo(() => {
    return enabledPrompts.length;
  }, [enabledPrompts]);

  // 计算预估费用
  const estimatedCost = useMemo(() => {
    return calculateEstimatedCost(totalImageCount, selectedModel);
  }, [totalImageCount, selectedModel]);

  const pricePerImage = useMemo(() => {
    const model = IMAGE_MODEL_OPTIONS.find(m => m.value === selectedModel);
    return model?.pricePerImage || 0.04;
  }, [selectedModel]);

  // 初始化 images
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

  // 同步 images 列表（当 prompts 变化时）
  useEffect(() => {
    if (prompts.length > 0) {
      const currentPromptIds = new Set(images.map(img => img.promptId));
      const enabledPromptIds = new Set(enabledPrompts.map(p => p.id));

      // 添加新的
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

      // 移除不再启用的
      setImages(prev => prev.filter(img => enabledPromptIds.has(img.promptId)));
    }
  }, [enabledPrompts, typeSizeMap]);

  // 自动展开第一个有图片的类型
  useEffect(() => {
    if (expandedType === null && enabledPrompts.length > 0) {
      const firstEnabledType = ALL_IMAGE_TYPES.find(t => enabledTypes[t.id]);
      if (firstEnabledType) {
        setExpandedType(firstEnabledType.id);
      }
    }
  }, [enabledPrompts.length, enabledTypes, expandedType]);

  const generateSingleImage = useCallback(async (promptId: string): Promise<boolean> => {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return false;

    const typeConfig = getTypeConfig(prompt.type);
    const aspectRatio = typeSizeMap[prompt.type] || typeConfig?.defaultSize || '1:1';
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
    if (enabledPrompts.length === 0) return;

    setIsGenerating(true);

    // 并发控制：DashScope 限制为 2，OpenRouter 保持 5
    const isDashScope = isDashScopeModel(selectedModel);
    const concurrency = isDashScope ? 2 : 5;
    const delayBetweenBatches = isDashScope ? 1500 : 0;

    const pendingPromptIds = enabledPrompts
      .filter(p => {
        const img = images.find(i => i.promptId === p.id);
        return !img || img.status === 'pending' || img.status === 'failed';
      })
      .map(p => p.id);

    for (let i = 0; i < pendingPromptIds.length; i += concurrency) {
      const batch = pendingPromptIds.slice(i, i + concurrency);
      await Promise.all(batch.map(id => generateSingleImage(id)));

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

  // 获取启用的类型配置（按核心/附加分组）
  const enabledCoreTypes = getCoreTypes().filter(t => enabledTypes[t.id]);
  const enabledAdditionalTypes = getAdditionalTypes().filter(t => enabledTypes[t.id]);

  const renderTypeSection = (typeConfig: typeof ALL_IMAGE_TYPES[0]) => {
    const typeImages = enabledImages.filter(img => {
      const prompt = prompts.find(p => p.id === img.promptId);
      return prompt?.type === typeConfig.id;
    });
    const completedInType = typeImages.filter(i => i.status === 'completed').length;
    const currentSize = typeSizeMap[typeConfig.id] || typeConfig.defaultSize;

    return (
      <div key={typeConfig.id} className="mb-3 bg-surface rounded-card overflow-hidden border border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          {/* 类型名和进度 */}
          <button
            onClick={() => setExpandedType(expandedType === typeConfig.id ? null : typeConfig.id)}
            className="flex-1 flex items-center justify-between hover:bg-secondary-hover transition-colors rounded px-2 py-1"
          >
            <span className="font-medium text-foreground">
              {typeConfig.name}
              <span className="text-muted text-sm ml-2">
                （{completedInType}/{typeConfig.count}）
              </span>
            </span>
            <span className={`transform transition-transform ${expandedType === typeConfig.id ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {/* 尺寸选择（可在 Step4 微调） */}
          {typeConfig.sizeOptions.length > 1 && (
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
          {typeConfig.sizeOptions.length === 1 && (
            <span className="text-xs text-muted px-2 py-1 bg-background rounded">
              {typeConfig.sizeOptions[0].label}
            </span>
          )}
        </div>

        {/* 展开的图片网格 */}
        {expandedType === typeConfig.id && (
          <div className="border-t border-border p-4">
            <div className="grid grid-cols-3 gap-4">
              {typeImages.map((image) => {
                const prompt = prompts.find(p => p.id === image.promptId);
                // 获取当前类型的宽高比
                const sizeOption = typeConfig.sizeOptions.find(s => s.value === currentSize);
                const aspectRatio = sizeOption?.aspectRatio || currentSize || '1:1';
                const aspectStyle = getAspectRatioStyle(aspectRatio);
                const isWide = isWideAspectRatio(aspectRatio);

                return (
                  <div
                    key={image.id}
                    className={`bg-background rounded-lg overflow-hidden relative border border-border ${isWide ? 'col-span-3' : ''}`}
                    style={{ aspectRatio: aspectStyle }}
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
                      <div className="group relative w-full h-full">
                        <img
                          src={image.url}
                          alt={`${prompt?.typeName} ${prompt?.index}`}
                          className="w-full h-full object-cover"
                        />
                        {/* 悬停遮罩和重新生成按钮 */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => handleGenerateSingle(image.promptId)}
                            className="px-3 py-[7px] bg-primary text-white rounded-control text-sm font-medium hover:bg-primary-hover transition-colors"
                          >
                            🔄 重新生成
                          </button>
                        </div>
                      </div>
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

  // 没有 prompts 时显示提示
  if (prompts.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <h3 className="text-heading-lg text-foreground mb-2">还没有 Prompt</h3>
        <p className="text-sm text-muted text-center max-w-md">
          请先在 Step 3 选择图片类型并生成 Prompt，然后再来这里生成图片
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 步骤说明 */}
      <div className="h-12 flex items-center gap-3 px-4 border-b border-border bg-secondary">
        <h2 className="text-heading-md text-foreground">Step 4: 生成图片</h2>
        <span className="text-body-sm text-muted">选择模型，开始生成产品图片</span>
      </div>

      {/* 控制栏 */}
      <div className="p-4 border-b border-border bg-surface">
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

        {/* 生成按钮和进度 */}
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={generateAllImages}
            disabled={isGenerating || enabledPrompts.length === 0}
            className="px-6 py-[7px] bg-primary text-white rounded-control font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enabledPrompts.length === 0
              ? '请先在 Step3 生成 Prompt'
              : isGenerating
                ? '生成中...'
                : `开始生成全部图片（${totalImageCount}张）`
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
              <div className="h-[3px] bg-[rgba(255,255,255,0.08)] rounded-pill overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 图片类型列表（只显示已启用的） */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 基础类型 */}
        {enabledCoreTypes.length > 0 && (
          <div className="mb-4">
            <h3 className="text-label text-accent-text mb-2">基础图片类型</h3>
            {enabledCoreTypes.map(typeConfig => renderTypeSection(typeConfig))}
          </div>
        )}

        {/* 附加类型 */}
        {enabledAdditionalTypes.length > 0 && (
          <div className="border-t border-border pt-4">
            <h3 className="text-label text-muted mb-2">附加图片类型</h3>
            {enabledAdditionalTypes.map(typeConfig => renderTypeSection(typeConfig))}
          </div>
        )}
      </div>
    </div>
  );
}
