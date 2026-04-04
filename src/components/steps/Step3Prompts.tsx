'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { IMAGE_TYPE_CONFIG, ImageType, ImagePrompt } from '@/types';

// localStorage key
const PROMPTS_STORAGE_KEY = 'product-image-ai-prompts';

export default function Step3Prompts() {
  const {
    productInfo,
    analysisResult,
    prompts,
    setPrompts,
    updatePrompt,
    isGeneratingPrompts,
    setIsGeneratingPrompts,
  } = useApp();

  const [error, setError] = useState('');
  const [expandedType, setExpandedType] = useState<ImageType | null>('main');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // 从 localStorage 恢复 prompts
  useEffect(() => {
    if (typeof window !== 'undefined' && prompts.length === 0) {
      const saved = localStorage.getItem(PROMPTS_STORAGE_KEY);
      if (saved) {
        try {
          const savedPrompts = JSON.parse(saved) as ImagePrompt[];
          if (savedPrompts.length > 0) {
            setPrompts(savedPrompts);
            console.log('Restored prompts from localStorage:', savedPrompts.length);
          }
        } catch (e) {
          console.error('Failed to restore prompts:', e);
        }
      }
    }
  }, []);

  // 保存 prompts 到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && prompts.length > 0) {
      localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(prompts));
      console.log('Saved prompts to localStorage:', prompts.length);
    }
  }, [prompts]);

  const handleGenerateAllPrompts = async () => {
    setIsGeneratingPrompts(true);
    setError('');

    try {
      const response = await fetch('/api/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productInfo, analysisResult }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Prompt生成失败');
      }

      setPrompts(data.prompts);
      console.log('Generated prompts:', data.prompts.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prompt生成失败，请重试');
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const handleRegenerateOne = async (promptId: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;

    setRegeneratingId(promptId);

    try {
      const response = await fetch('/api/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productInfo,
          analysisResult,
          singleType: prompt.type,
          singleIndex: prompt.index - 1,
        }),
      });

      const data = await response.json();
      if (data.prompts && data.prompts.length > 0) {
        const newPrompt = data.prompts.find(
          (p: { type: ImageType; index: number }) => p.type === prompt.type && p.index === prompt.index
        );
        if (newPrompt) {
          updatePrompt(promptId, newPrompt.prompt);
        }
      }
    } catch (err) {
      console.error('Regenerate failed:', err);
    } finally {
      setRegeneratingId(null);
    }
  };

  const promptsByType = (Object.keys(IMAGE_TYPE_CONFIG) as ImageType[]).map(type => ({
    type,
    name: IMAGE_TYPE_CONFIG[type].name,
    count: IMAGE_TYPE_CONFIG[type].count,
    prompts: prompts.filter(p => p.type === type),
  }));

  const totalPrompts = prompts.length;

  return (
    <div className="h-full flex flex-col">
      {/* 步骤说明 */}
      <div className="p-4 border-b border-border bg-secondary/50">
        <h2 className="text-lg font-bold text-foreground">✨ Step 3: 生成图片Prompt</h2>
        <p className="text-sm text-muted mt-1">
          为26张产品图片生成专业的AI绘图Prompt（主图×6 / 卖点图×7 / 场景图×7 / 细节图×2 / 使用图×2 / 手持图×2）
        </p>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        {prompts.length === 0 && !isGeneratingPrompts && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-foreground mb-2">生成图片Prompt</h3>
            <p className="text-muted mb-4">
              点击下方按钮，AI将根据产品分析结果生成26张图片的专业Prompt
            </p>

            {/* 图片类型说明 */}
            <div className="max-w-lg mx-auto bg-secondary rounded-lg p-4 mb-6 text-left">
              <h4 className="text-sm font-medium text-primary mb-3">将要生成的图片类型：</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {(Object.entries(IMAGE_TYPE_CONFIG) as [ImageType, { name: string; count: number }][]).map(
                  ([type, config]) => (
                    <div key={type} className="flex justify-between text-muted">
                      <span>{config.name}</span>
                      <span className="text-foreground">×{config.count}</span>
                    </div>
                  )
                )}
                <div className="col-span-2 border-t border-border pt-2 mt-2 flex justify-between font-medium">
                  <span className="text-foreground">合计</span>
                  <span className="text-primary">26张</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm max-w-md mx-auto">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerateAllPrompts}
              disabled={isGeneratingPrompts}
              className="px-8 py-4 bg-primary text-background rounded-xl font-bold text-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🚀 一键生成所有Prompt
            </button>
          </div>
        )}

        {isGeneratingPrompts && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-foreground mb-2">正在生成Prompt...</h3>
            <p className="text-muted">AI正在为26张图片编写专业Prompt，请稍候</p>
          </div>
        )}

        {prompts.length > 0 && !isGeneratingPrompts && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-muted">
                已生成 <span className="text-primary font-bold">{totalPrompts}</span> 条Prompt
              </span>
              <button
                onClick={handleGenerateAllPrompts}
                className="text-sm text-primary hover:text-primary-hover"
              >
                🔄 重新生成全部
              </button>
            </div>

            {/* 手风琴列表 */}
            {promptsByType.map(({ type, name, count, prompts: typePrompts }) => (
              <div key={type} className="bg-secondary rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedType(expandedType === type ? null : type)}
                  className="w-full px-4 py-3 flex justify-between items-center hover:bg-secondary-hover transition-colors"
                >
                  <span className="font-medium text-foreground">
                    {name} <span className="text-muted text-sm">（{typePrompts.length}/{count}）</span>
                  </span>
                  <span className={`transform transition-transform ${expandedType === type ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {expandedType === type && (
                  <div className="border-t border-border">
                    {typePrompts.map((prompt) => (
                      <div key={prompt.id} className="p-4 border-b border-border last:border-b-0">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-primary">
                            {name} #{prompt.index}
                          </span>
                          <button
                            onClick={() => handleRegenerateOne(prompt.id)}
                            disabled={regeneratingId === prompt.id}
                            className="text-xs text-muted hover:text-primary disabled:opacity-50"
                          >
                            {regeneratingId === prompt.id ? '生成中...' : '🔄 重新生成'}
                          </button>
                        </div>
                        <textarea
                          value={prompt.prompt}
                          onChange={(e) => updatePrompt(prompt.id, e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground resize-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
