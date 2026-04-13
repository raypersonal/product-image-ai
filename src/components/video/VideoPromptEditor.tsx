'use client';

import { useState } from 'react';
import CameraMotionSelector from './CameraMotionSelector';
import {
  EFFECT_CATEGORY_NAMES,
  getEffectsByCategory,
} from '@/lib/video/videoPromptGenerator';
import { VIDEO_DURATION_OPTIONS } from '@/lib/video/videoConstants';
import { VIDEO_ASPECT_RATIOS } from '@/lib/videoAspectRatio';

interface VideoPromptEditorProps {
  cameraMotion: string;
  selectedEffects: string[];
  customPrompt: string;
  duration: number;
  prompt: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  sourceImageRatio?: string;  // 源图宽高比，用于判断是否需要扩图
  onSetCameraMotion: (motion: string) => void;
  onToggleEffect: (effectId: string) => void;
  onSetCustomPrompt: (text: string) => void;
  onSetDuration: (duration: number) => void;
  onSetAspectRatio: (ratio: '16:9' | '9:16' | '1:1') => void;
}

export default function VideoPromptEditor({
  cameraMotion,
  selectedEffects,
  customPrompt,
  duration,
  prompt,
  aspectRatio,
  sourceImageRatio,
  onSetCameraMotion,
  onToggleEffect,
  onSetCustomPrompt,
  onSetDuration,
  onSetAspectRatio,
}: VideoPromptEditorProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const effectsByCategory = getEffectsByCategory();

  // 检查是否需要扩图
  const needsOutpaint = sourceImageRatio && sourceImageRatio !== aspectRatio;

  return (
    <div className="p-4 space-y-5">
      <h2 className="text-heading-md text-foreground">视频配置</h2>

      {/* 运镜选择器 */}
      <div>
        <h3 className="text-label text-foreground mb-2">运镜方式</h3>
        <CameraMotionSelector
          selected={cameraMotion}
          onSelect={onSetCameraMotion}
        />
      </div>

      {/* 动效标签 */}
      <div>
        <h3 className="text-label text-foreground mb-2 flex items-center gap-2">
          动效效果
          {selectedEffects.length > 0 && (
            <span className="px-1.5 py-0.5 bg-primary text-white text-caption rounded-pill">
              {selectedEffects.length}
            </span>
          )}
        </h3>

        <div className="space-y-3">
          {Object.entries(effectsByCategory).map(([category, effects]) => (
            <div key={category}>
              <div className="text-xs text-muted mb-1.5">
                {EFFECT_CATEGORY_NAMES[category] || category}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {effects.map((effect) => {
                  const isSelected = selectedEffects.includes(effect.id);
                  return (
                    <button
                      key={effect.id}
                      onClick={() => onToggleEffect(effect.id)}
                      className={`px-2.5 py-1.5 rounded-control text-caption font-medium transition-colors ${
                        isSelected
                          ? 'bg-primary text-white'
                          : 'bg-surface text-muted border border-border hover:text-foreground hover:bg-surface-hover'
                      }`}
                    >
                      {effect.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 视频比例选择 */}
      <div>
        <h3 className="text-label text-foreground mb-2">视频比例</h3>
        <div className="flex gap-2">
          {VIDEO_ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.id}
              onClick={() => onSetAspectRatio(ratio.id as '16:9' | '9:16' | '1:1')}
              className={`flex-1 py-[7px] rounded-control text-body-sm font-medium transition-colors ${
                aspectRatio === ratio.id
                  ? 'bg-primary text-white'
                  : 'bg-surface text-muted border border-border hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              <span className="mr-1">{ratio.icon}</span>
              {ratio.label}
            </button>
          ))}
        </div>
        {/* 扩图提示 */}
        {needsOutpaint && (
          <div className="mt-2 px-3 py-2 bg-warning/10 border border-warning/25 rounded-control">
            <p className="text-caption text-warning">
              源图比例为 {sourceImageRatio}，将自动扩展至 {aspectRatio}
            </p>
          </div>
        )}
      </div>

      {/* 时长选择 */}
      <div>
        <h3 className="text-label text-foreground mb-2">视频时长</h3>
        <div className="flex gap-2">
          {VIDEO_DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onSetDuration(option.value)}
              className={`flex-1 py-[7px] rounded-control text-body-sm font-medium transition-colors ${
                duration === option.value
                  ? 'bg-primary text-white'
                  : 'bg-surface text-muted border border-border hover:text-foreground hover:bg-surface-hover'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 分辨率显示 */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface rounded-control border border-border">
        <span className="text-sm text-muted">分辨率</span>
        <span className="text-sm font-medium text-foreground">
          {VIDEO_ASPECT_RATIOS.find(r => r.id === aspectRatio)?.width}×
          {VIDEO_ASPECT_RATIOS.find(r => r.id === aspectRatio)?.height}
        </span>
      </div>

      {/* 自定义文本 */}
      <div>
        <h3 className="text-label text-foreground mb-2">自定义补充（可选）</h3>
        <textarea
          value={customPrompt}
          onChange={(e) => onSetCustomPrompt(e.target.value)}
          placeholder="添加自定义描述，如：产品在视频中缓缓旋转展示..."
          rows={2}
          className="w-full px-3 py-2 bg-surface border border-border rounded-control text-sm text-foreground placeholder:text-muted resize-none"
        />
      </div>

      {/* 生成的 Prompt 预览 */}
      <div>
        <button
          onClick={() => setShowPrompt(!showPrompt)}
          className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
        >
          <span>{showPrompt ? '▼' : '▶'}</span>
          查看生成的 Prompt
        </button>
        {showPrompt && (
          <div className="mt-2 p-3 bg-surface rounded-control border border-border">
            <p className="text-xs text-muted break-words leading-relaxed">
              {prompt || '请配置视频参数后自动生成'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
