'use client';

import { useState } from 'react';
import CameraMotionSelector from './CameraMotionSelector';
import {
  EFFECT_CATEGORY_NAMES,
  getEffectsByCategory,
} from '@/lib/video/videoPromptGenerator';
import { VIDEO_DURATION_OPTIONS } from '@/lib/video/jimengVideo';

interface VideoPromptEditorProps {
  cameraMotion: string;
  selectedEffects: string[];
  customPrompt: string;
  duration: number;
  prompt: string;
  onSetCameraMotion: (motion: string) => void;
  onToggleEffect: (effectId: string) => void;
  onSetCustomPrompt: (text: string) => void;
  onSetDuration: (duration: number) => void;
}

export default function VideoPromptEditor({
  cameraMotion,
  selectedEffects,
  customPrompt,
  duration,
  prompt,
  onSetCameraMotion,
  onToggleEffect,
  onSetCustomPrompt,
  onSetDuration,
}: VideoPromptEditorProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const effectsByCategory = getEffectsByCategory();

  return (
    <div className="p-4 space-y-5">
      <h2 className="font-semibold text-foreground flex items-center gap-2">
        <span>🎬</span>
        视频配置
      </h2>

      {/* 运镜选择器 */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
          <span>📹</span>
          运镜方式
        </h3>
        <CameraMotionSelector
          selected={cameraMotion}
          onSelect={onSetCameraMotion}
        />
      </div>

      {/* 动效标签 */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
          <span>✨</span>
          动效效果
          {selectedEffects.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-green-600 text-white text-xs rounded">
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
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-green-600 text-white'
                          : 'bg-secondary text-muted hover:text-foreground hover:bg-secondary-hover'
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

      {/* 时长选择 */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
          <span>⏱️</span>
          视频时长
        </h3>
        <div className="flex gap-2">
          {VIDEO_DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => onSetDuration(option.value)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                duration === option.value
                  ? 'bg-green-600 text-white'
                  : 'bg-secondary text-muted hover:text-foreground hover:bg-secondary-hover'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 分辨率显示 */}
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/50 rounded-lg">
        <span className="text-sm text-muted">分辨率</span>
        <span className="text-sm font-medium text-foreground">1080P (1920×1080)</span>
      </div>

      {/* 自定义文本 */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
          <span>✏️</span>
          自定义补充（可选）
        </h3>
        <textarea
          value={customPrompt}
          onChange={(e) => onSetCustomPrompt(e.target.value)}
          placeholder="添加自定义描述，如：产品在视频中缓缓旋转展示..."
          rows={2}
          className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:border-green-500 focus:outline-none resize-none"
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
          <div className="mt-2 p-3 bg-secondary/50 rounded-lg">
            <p className="text-xs text-muted break-words leading-relaxed">
              {prompt || '请配置视频参数后自动生成'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
