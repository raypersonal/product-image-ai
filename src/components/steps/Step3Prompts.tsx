'use client';

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  ALL_IMAGE_TYPES,
  ImageTypeId,
  ImagePrompt,
  PROMPT_MODEL_OPTIONS,
  getCoreTypes,
  getAdditionalTypes,
  isDashScopeModel,
} from '@/types';

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
    promptModel,
    setPromptModel,
    enabledTypes,
    toggleType,
    enableAllTypes,
    disableAllTypes,
    enableCoreTypesOnly,
  } = useApp();

  const [error, setError] = useState('');
  const [expandedType, setExpandedType] = useState<string | null>('main');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // 计算启用的类型数量和图片总数
  const enabledTypeCount = useMemo(() => {
    return Object.values(enabledTypes).filter(Boolean).length;
  }, [enabledTypes]);

  const totalPromptCount = useMemo(() => {
    return ALL_IMAGE_TYPES.reduce((sum, t) => {
      if (enabledTypes[t.id]) {
        return sum + t.count;
      }
      return sum;
    }, 0);
  }, [enabledTypes]);

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
    if (enabledTypeCount === 0) {
      setError('请至少选择一个图片类型');
      return;
    }

    setIsGeneratingPrompts(true);
    setError('');

    // 构建启用类型的配置，包含 promptHint
    const enabledTypeConfigs = ALL_IMAGE_TYPES
      .filter(t => enabledTypes[t.id])
      .map(t => ({
        id: t.id,
        name: t.name,
        count: t.count,
        promptHint: t.promptHint,
      }));

    try {
      const response = await fetch('/api/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productInfo,
          analysisResult,
          enabledTypes: enabledTypeConfigs,
          model: promptModel,
        }),
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

    const typeConfig = ALL_IMAGE_TYPES.find(t => t.id === prompt.type);

    try {
      const response = await fetch('/api/generate-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productInfo,
          analysisResult,
          singleType: prompt.type,
          singleIndex: prompt.index - 1,
          model: promptModel,
          promptHint: typeConfig?.promptHint,
        }),
      });

      const data = await response.json();
      if (data.prompts && data.prompts.length > 0) {
        const newPrompt = data.prompts.find(
          (p: { type: ImageTypeId; index: number }) => p.type === prompt.type && p.index === prompt.index
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

  // 按类型分组 prompts
  const promptsByType = useMemo(() => {
    return ALL_IMAGE_TYPES
      .filter(t => enabledTypes[t.id])
      .map(typeConfig => ({
        type: typeConfig.id,
        name: typeConfig.name,
        count: typeConfig.count,
        prompts: prompts.filter(p => p.type === typeConfig.id),
      }));
  }, [prompts, enabledTypes]);

  const coreTypes = getCoreTypes();
  const additionalTypes = getAdditionalTypes();

  return (
    <div className="h-full flex flex-col">
      {/* 步骤说明 */}
      <div className="p-4 border-b border-border bg-secondary/50">
        <h2 className="text-lg font-bold text-foreground">✨ Step 3: 生成图片Prompt</h2>
        <p className="text-sm text-muted mt-1">
          选择要生成的图片类型和AI模型，为产品图片生成专业Prompt
        </p>
      </div>

      {/* 控制栏 */}
      <div className="p-4 border-b border-border bg-secondary/30">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Prompt 模型选择 */}
          <div>
            <label className="block text-xs text-muted mb-1">Prompt生成模型</label>
            <select
              value={promptModel}
              onChange={(e) => setPromptModel(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground min-w-[240px]"
            >
              <optgroup label="百炼（DashScope）- 免费额度">
                {PROMPT_MODEL_OPTIONS.filter(m => m.provider === 'dashscope').map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </optgroup>
              <optgroup label="OpenRouter">
                {PROMPT_MODEL_OPTIONS.filter(m => m.provider === 'openrouter').map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="flex-1"></div>

          {/* 统计信息和提供商标识 */}
          <div className="text-right">
            <div className="text-sm text-muted">
              将为 <span className="text-primary font-bold">{enabledTypeCount}</span> 个类型
              生成 <span className="text-primary font-bold">{totalPromptCount}</span> 条 Prompt
            </div>
            <div className="text-xs text-muted mt-1">
              {isDashScopeModel(promptModel) ? (
                <span className="text-primary">使用百炼平台（免费额度）</span>
              ) : (
                <span>使用 OpenRouter</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        {prompts.length === 0 && !isGeneratingPrompts && (
          <div className="space-y-6">
            {/* 快捷操作 */}
            <div className="flex gap-2 justify-center">
              <button
                onClick={enableAllTypes}
                className="px-3 py-1.5 bg-secondary text-foreground rounded text-sm hover:bg-secondary-hover"
              >
                全选
              </button>
              <button
                onClick={disableAllTypes}
                className="px-3 py-1.5 bg-secondary text-foreground rounded text-sm hover:bg-secondary-hover"
              >
                全不选
              </button>
              <button
                onClick={enableCoreTypesOnly}
                className="px-3 py-1.5 bg-secondary text-foreground rounded text-sm hover:bg-secondary-hover"
              >
                仅基础图
              </button>
            </div>

            {/* 核心类型 */}
            <div className="bg-secondary rounded-lg p-4">
              <h4 className="text-sm font-medium text-primary mb-3">📦 基础图片类型</h4>
              <div className="grid grid-cols-2 gap-2">
                {coreTypes.map(typeConfig => (
                  <label
                    key={typeConfig.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary-hover p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={enabledTypes[typeConfig.id] || false}
                      onChange={() => toggleType(typeConfig.id)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className={enabledTypes[typeConfig.id] ? 'text-foreground' : 'text-muted'}>
                      {typeConfig.name}
                    </span>
                    <span className="text-muted text-xs">×{typeConfig.count}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 附加类型 */}
            <div className="bg-secondary rounded-lg p-4">
              <h4 className="text-sm font-medium text-muted mb-3">📎 附加图片类型（可选）</h4>
              <div className="grid grid-cols-2 gap-2">
                {additionalTypes.map(typeConfig => (
                  <label
                    key={typeConfig.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary-hover p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={enabledTypes[typeConfig.id] || false}
                      onChange={() => toggleType(typeConfig.id)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className={enabledTypes[typeConfig.id] ? 'text-foreground' : 'text-muted'}>
                      {typeConfig.name}
                    </span>
                    <span className="text-muted text-xs">×{typeConfig.count}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
                {error}
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleGenerateAllPrompts}
                disabled={isGeneratingPrompts || enabledTypeCount === 0}
                className="px-8 py-4 bg-primary text-background rounded-xl font-bold text-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enabledTypeCount === 0
                  ? '请至少选择一个类型'
                  : `🚀 生成 ${totalPromptCount} 条 Prompt`
                }
              </button>
            </div>
          </div>
        )}

        {isGeneratingPrompts && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-bold text-foreground mb-2">正在生成Prompt...</h3>
            <p className="text-muted">
              使用 {PROMPT_MODEL_OPTIONS.find(m => m.value === promptModel)?.label || promptModel} 生成中，请稍候
            </p>
          </div>
        )}

        {prompts.length > 0 && !isGeneratingPrompts && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-muted">
                已生成 <span className="text-primary font-bold">{prompts.length}</span> 条Prompt
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
