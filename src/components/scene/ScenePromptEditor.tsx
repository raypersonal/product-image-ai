'use client';

import { useState } from 'react';
import SceneTagSelector from './SceneTagSelector';
import { PromptMode, SceneProductInfo, UploadedImage } from './SceneWorkbench';

// 输出尺寸选项
const SIZE_OPTIONS = [
  { value: '1:1', label: '1:1 (1024×1024)', desc: '正方形' },
  { value: '4:3', label: '4:3 (1024×768)', desc: '横向' },
  { value: '3:4', label: '3:4 (768×1024)', desc: '纵向' },
  { value: '16:9', label: '16:9 (1280×720)', desc: '宽屏' },
  { value: '9:16', label: '9:16 (720×1280)', desc: '竖屏' },
  { value: '21:9', label: '21:9 (1260×540)', desc: '超宽' },
];

interface ScenePromptEditorProps {
  // 标签选择
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
  onClearTags: () => void;
  // 提示词
  promptMode: PromptMode;
  onSetPromptMode: (mode: PromptMode) => void;
  prompt: string;
  onSetPrompt: (prompt: string) => void;
  isPromptEdited: boolean;
  // 产品信息（用于自动生成）
  productImages: UploadedImage[];
  productInfo: SceneProductInfo;
  // 高级选项
  outputSize: string;
  onSetOutputSize: (size: string) => void;
  styleStrength: number;
  onSetStyleStrength: (value: number) => void;
  referenceWeight: number;
  onSetReferenceWeight: (value: number) => void;
  // 生成状态
  isGeneratingPrompt: boolean;
  onGeneratePrompt: () => void;
}

export default function ScenePromptEditor({
  selectedTags,
  onToggleTag,
  onClearTags,
  promptMode,
  onSetPromptMode,
  prompt,
  onSetPrompt,
  isPromptEdited,
  productImages,
  productInfo,
  outputSize,
  onSetOutputSize,
  styleStrength,
  onSetStyleStrength,
  referenceWeight,
  onSetReferenceWeight,
  isGeneratingPrompt,
  onGeneratePrompt,
}: ScenePromptEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const canGeneratePrompt = selectedTags.length > 0 || productInfo.name;
  const isAutoMode = promptMode === 'auto';
  const isManualMode = promptMode === 'manual';

  // 模式配置
  const modes = [
    {
      value: 'auto' as PromptMode,
      icon: '⚡',
      label: '自动',
      desc: '选标签自动生成',
    },
    {
      value: 'manual' as PromptMode,
      icon: '✏️',
      label: '手动',
      desc: '自由编写',
    },
    {
      value: 'hybrid' as PromptMode,
      icon: '🔀',
      label: '混合',
      desc: '自动+微调',
    },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* 模式切换 */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          提示词模式
        </label>
        <div className="grid grid-cols-3 gap-2">
          {modes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => onSetPromptMode(mode.value)}
              className={`px-3 py-2 rounded-control text-body-sm transition-colors flex flex-col items-center ${
                promptMode === mode.value
                  ? 'bg-primary text-white'
                  : 'bg-surface text-muted border border-border hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              <span className="font-medium">{mode.label}</span>
              <span className={`text-caption mt-0.5 ${
                promptMode === mode.value ? 'text-white/70' : 'text-muted'
              }`}>
                {mode.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 场景标签选择器 */}
      <SceneTagSelector
        selectedTags={selectedTags}
        onToggleTag={onToggleTag}
        onClearAll={onClearTags}
      />

      {/* 生成提示词按钮（自动/混合模式） */}
      {!isManualMode && (
        <button
          onClick={onGeneratePrompt}
          disabled={!canGeneratePrompt || isGeneratingPrompt}
          className="w-full py-[7px] bg-surface text-foreground border border-border rounded-control font-medium text-body-sm hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGeneratingPrompt ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-foreground border-t-transparent rounded-full animate-spin"></span>
              生成提示词中...
            </>
          ) : (
            <>
              {prompt && !isPromptEdited ? '重新生成提示词' : '生成提示词'}
            </>
          )}
        </button>
      )}

      {/* 提示词文本框 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground">
            提示词
          </label>
          {isAutoMode && (
            <span className="text-caption text-muted bg-surface px-2 py-0.5 rounded-pill border border-border">
              自动模式下只读
            </span>
          )}
          {promptMode === 'hybrid' && isPromptEdited && (
            <span className="text-caption text-accent-text bg-accent-subtle px-2 py-0.5 rounded-pill">
              已手动编辑
            </span>
          )}
        </div>
        <textarea
          value={prompt}
          onChange={(e) => onSetPrompt(e.target.value)}
          readOnly={isAutoMode}
          placeholder={
            isAutoMode
              ? '选择场景标签后点击「生成提示词」...'
              : isManualMode
              ? '输入场景描述，例如：A colorful balloon set displayed on a wooden table in a cozy living room with warm natural lighting, birthday party atmosphere...'
              : '先点击「生成提示词」，然后可以在此微调...'
          }
          rows={6}
          className={`w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder-muted resize-none transition-colors ${
            isAutoMode
              ? 'opacity-70 cursor-not-allowed bg-surface'
              : 'focus:border-[rgba(94,106,210,0.6)] focus:shadow-[0_0_0_3px_rgba(94,106,210,0.12)]'
          }`}
        />
        {prompt && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted">
              {prompt.length} 字符
            </span>
            {!isAutoMode && (
              <button
                onClick={() => onSetPrompt('')}
                className="text-xs text-muted hover:text-error transition-colors"
              >
                清空
              </button>
            )}
          </div>
        )}
      </div>

      {/* 高级选项折叠面板 */}
      <div className="border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-3 py-2.5 bg-surface text-body-sm font-medium text-foreground flex items-center justify-between hover:bg-surface-hover transition-colors"
        >
          <span>高级选项</span>
          <span className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {showAdvanced && (
          <div className="p-3 space-y-4 bg-background">
            {/* 输出尺寸 */}
            <div>
              <label className="block text-xs text-muted mb-1.5">
                输出尺寸
              </label>
              <select
                value={outputSize}
                onChange={(e) => onSetOutputSize(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground"
              >
                {SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.desc}
                  </option>
                ))}
              </select>
            </div>

            {/* 风格强度滑块 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-muted">风格强度</label>
                <span className="text-xs text-primary font-medium">{styleStrength}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={styleStrength}
                onChange={(e) => onSetStyleStrength(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>淡雅</span>
                <span>浓烈</span>
              </div>
            </div>

            {/* 参考图权重滑块 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-muted">参考图权重</label>
                <span className="text-xs text-primary font-medium">{referenceWeight}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={referenceWeight}
                onChange={(e) => onSetReferenceWeight(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted mt-1">
                <span>自由发挥</span>
                <span>严格参考</span>
              </div>
              {productImages.length === 0 && (
                <p className="text-xs text-warning mt-1.5">
                  ⚠️ 未上传参考图，此选项暂不生效
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
