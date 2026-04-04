'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { IMAGE_TYPE_CONFIG, ImageType, MODEL_OPTIONS, SIZE_OPTIONS } from '@/types';

export default function Step4Generate() {
  const {
    prompts,
    images,
    updateImage,
    initializeImages,
    selectedModel,
    setSelectedModel,
    selectedSize,
    setSelectedSize,
  } = useApp();

  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedType, setExpandedType] = useState<ImageType | null>('main');

  useEffect(() => {
    if (prompts.length > 0 && images.length === 0) {
      initializeImages();
    }
  }, [prompts.length, images.length, initializeImages]);

  const generateSingleImage = useCallback(async (promptId: string): Promise<boolean> => {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return false;

    const imageId = `img-${promptId}`;
    updateImage(imageId, { status: 'generating' });

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.prompt,
          model: selectedModel,
          aspectRatio: selectedSize,  // 使用 aspect_ratio 格式如 "1:1"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '图片生成失败');
      }

      updateImage(imageId, { status: 'completed', url: data.url });
      return true;
    } catch (err) {
      updateImage(imageId, {
        status: 'failed',
        error: err instanceof Error ? err.message : '生成失败',
      });
      return false;
    }
  }, [prompts, selectedModel, selectedSize, updateImage]);

  const generateAllImages = async () => {
    setIsGenerating(true);

    // 并发控制：同时最多5个
    const concurrency = 5;
    const pendingPromptIds = prompts
      .filter(p => {
        const img = images.find(i => i.promptId === p.id);
        return !img || img.status === 'pending' || img.status === 'failed';
      })
      .map(p => p.id);

    for (let i = 0; i < pendingPromptIds.length; i += concurrency) {
      const batch = pendingPromptIds.slice(i, i + concurrency);
      await Promise.all(batch.map(id => generateSingleImage(id)));
    }

    setIsGenerating(false);
  };

  const handleGenerateSingle = async (promptId: string) => {
    await generateSingleImage(promptId);
  };

  const completedCount = images.filter(img => img.status === 'completed').length;
  const failedCount = images.filter(img => img.status === 'failed').length;
  const generatingCount = images.filter(img => img.status === 'generating').length;
  const totalCount = images.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const imagesByType = (Object.keys(IMAGE_TYPE_CONFIG) as ImageType[]).map(type => ({
    type,
    name: IMAGE_TYPE_CONFIG[type].name,
    images: images.filter(img => {
      const prompt = prompts.find(p => p.id === img.promptId);
      return prompt?.type === type;
    }),
  }));

  return (
    <div className="h-full flex flex-col">
      {/* 步骤说明 */}
      <div className="p-4 border-b border-border bg-secondary/50">
        <h2 className="text-lg font-bold text-foreground">🎨 Step 4: 生成图片</h2>
        <p className="text-sm text-muted mt-1">
          选择模型和尺寸，开始生成产品图片
        </p>
      </div>

      {/* 控制栏 */}
      <div className="p-4 border-b border-border bg-secondary/30">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs text-muted mb-1">AI模型</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground min-w-[200px]"
            >
              {MODEL_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">图片尺寸</label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground min-w-[150px]"
            >
              {SIZE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="flex-1"></div>

          <button
            onClick={generateAllImages}
            disabled={isGenerating || prompts.length === 0}
            className="px-6 py-3 bg-primary text-background rounded-lg font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? '生成中...' : `🚀 开始生成全部图片（${totalCount}张）`}
          </button>
        </div>

        {/* 进度条 */}
        {totalCount > 0 && (
          <div className="mt-4">
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

      {/* 图片列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {imagesByType.map(({ type, name, images: typeImages }) => (
          <div key={type} className="mb-4 bg-secondary rounded-lg overflow-hidden">
            <button
              onClick={() => setExpandedType(expandedType === type ? null : type)}
              className="w-full px-4 py-3 flex justify-between items-center hover:bg-secondary-hover transition-colors"
            >
              <span className="font-medium text-foreground">
                {name}
                <span className="text-muted text-sm ml-2">
                  （{typeImages.filter(i => i.status === 'completed').length}/{typeImages.length}）
                </span>
              </span>
              <span className={`transform transition-transform ${expandedType === type ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {expandedType === type && (
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
        ))}
      </div>
    </div>
  );
}
